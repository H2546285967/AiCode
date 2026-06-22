# -*- coding: utf-8 -*-
"""
左脑在线授权模块 v3.0
====================
客户端自动激活 + 自动续期 + 心跳验证 + 功能开关 + 激活码激活
从"手动发码传文件"到"客户端自动上传指纹 + 自动拉取授权"

加密狗1兼容：
  - 在线签发的 license 保留 sign_prefix 字段
  - XOR 密钥派生逻辑（_derive_aes_key）完全不变
  - engine_encrypted.dat 解密逻辑完全不变

v2.0 新增：
  - 激活码激活（XXXX-XXXX-XXXX-XXXX格式）
  - 功能开关读取与运行时控制
  - 母包版本校验
  - 增强离线缓存策略
  - 心跳返回功能开关（远程动态更新）

v3.0 新增：
  - RSA+AES嵌套解密license（配合服务器v3.0加密传输）
  - 预刷新逻辑（auto_renewed自动更新本地license，到期前静默续期，紧急续费标记）
  - 降级策略（服务器不可达时本地缓存自动延长，在线恢复后自动清除）
  - 换绑改为审批制（不再直接换绑成功，需管理员审批）
  - HTTPS支持（默认https，连接失败自动降级http）

v3.0 新增：
  - RSA+AES嵌套解密license（配合服务器v3.0加密传输）
  - 预刷新逻辑（auto_renewed自动更新本地license，到期前静默续期，紧急续费标记）
  - 降级策略（服务器不可达时本地缓存自动延长，在线恢复后自动清除）
  - 换绑改为审批制（不再直接换绑成功，需管理员审批）
  - GUI提示接口（供启动左脑.py调用，判断续费提醒/激活提示/状态消息）

v3.3 安全加固：
  - 移除HTTP降级（防中间人攻击）
  - RSA私钥默认值从PLACEHOLDER改为None，未配置时不启动
  - 密钥从环境变量强制读取，无硬编码默认值
  - 降级窗口收紧：7天→2天，每次24h→8h，防免费续期漏洞
  - AES解密从CBC模式改为GCM模式（与服务端AESGCM加密对称），优先使用cryptography库
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Tuple

# ====================== 配置 ======================

# 服务器地址（v3.5: 优先从 crypto_config 读取，不再明文硬编码）
try:
    from crypto_config import SERVER_URL as _SERVER_URL
    SERVER_URL = _SERVER_URL
except (ImportError, NameError):
    SERVER_URL = os.environ.get("ZUONAO_SERVER_URL", "")
    if not SERVER_URL:
        print("🧠 安全错误：服务器地址未配置，系统拒绝启动")
        import sys
        sys.exit(1)
# 客户端密钥已从 crypto_config 导入（上方的 try/except 块）

# 加密狗1 兼容密钥（v3.6: RSA加密方向反转，客户端持有公钥验证签名）
try:
    from crypto_config import SECRET_KEY, AES_KEY_SALT, RSA_PUBLIC_KEY_PEM, RSA_PRIVATE_KEY_PEM, CLIENT_API_KEY, CLIENT_SECRET, SERVER_URL as SERVER_URL_DEFAULT, SERVER_CA_PEM
except ImportError:
    print("🧠 安全错误：密钥保护模块缺失，系统拒绝启动")
    print("   请确认安装包完整，或联系卖家获取正版安装包")
    import sys
    sys.exit(1)

# 离线缓存阈值（小时）
CACHE_HOURS_FORMAL = 720  # 正式版 720h
CACHE_HOURS_TRIAL = 24   # 试用版 24h
# 心跳间隔（小时）
HEARTBEAT_HOURS_FORMAL = 24  # 正式版 24h
HEARTBEAT_HOURS_TRIAL = 4    # 试用版 4h
# 续费提醒天数
RENEW_DAYS_BEFORE_EXPIRE = 7
RENEW_DAYS_URGENT = 3

# 降级策略参数（v3.3: 收紧降级窗口，防止免费续期漏洞；v3.6: 加30天窗口限制）
DEGRADATION_EXTEND_HOURS = 8    # 每次降级延长小时数（原24h→8h）
DEGRADATION_MAX_DAYS = 2        # 最大降级天数（原7天→2天）
DEGRADATION_MAX_CONSECUTIVE = 3 # 最大连续降级次数，超过则必须联网
DEGRADATION_WINDOW_DAYS = 30    # v3.6: 30天内最多允许N次重置（防循环滥用）
DEGRADATION_MAX_RESETS_IN_WINDOW = 3  # v3.6: 30天窗口内最多3次重置连续计数

# 本地文件路径
LIC_FILE = Path(__file__).resolve().parent / "license.lic"
TOKEN_FILE = Path(__file__).resolve().parent / ".license_token"
CACHE_FILE = Path(__file__).resolve().parent / ".license_cache"
FEATURES_FILE = Path(__file__).resolve().parent / ".feature_switches"
DEGRADATION_FILE = Path(__file__).resolve().parent / ".degradation"


# ====================== license.lic 解密（v3.6.1） ======================

def decrypt_license_file_content() -> Optional[dict]:
    """解密本地 license.lic（v3.11.4: 支持三种格式）

    格式1: [16字节IV] + [AES-CBC加密的JSON] + [32字节HMAC-SHA256签名]
    格式2: 明文JSON（旧版本遗留 / 打包时预签名）
    格式3: JSON含 {signed_hash, encrypted_data, iv}（服务器v3.6+ RSA+AES格式，v3.11.4新增）
    """
    if not LIC_FILE.exists():
        return None

    raw = LIC_FILE.read_bytes()

    # ── 格式2 & 3: 明文JSON ──
    try:
        lic = json.loads(raw.decode("utf-8"))
        if isinstance(lic, dict):
            # v3.11.4: 如果含 RSA+AES 内层加密，先解密
            if "signed_hash" in lic and "encrypted_data" in lic:
                try:
                    inner_data = OnlineLicense._verify_and_decrypt_v36_static(lic)
                    data_str = json.dumps(inner_data, sort_keys=True, ensure_ascii=False).encode("utf-8")
                    sig = hmac.new(SECRET_KEY, data_str, hashlib.sha256).hexdigest()
                    return {"data": inner_data, "signature": sig}
                except Exception:
                    return None
            # 如果 data 字段内含内层加密（双重加密残留）
            if "data" in lic and isinstance(lic["data"], dict):
                if "signed_hash" in lic["data"] and "encrypted_data" in lic["data"]:
                    try:
                        inner_data = OnlineLicense._verify_and_decrypt_v36_static(lic["data"])
                        data_str = json.dumps(inner_data, sort_keys=True, ensure_ascii=False).encode("utf-8")
                        sig = hmac.new(SECRET_KEY, data_str, hashlib.sha256).hexdigest()
                        return {"data": inner_data, "signature": sig}
                    except Exception:
                        return None
            return lic
    except (json.JSONDecodeError, UnicodeDecodeError):
        pass

    # v3.6: 二进制加密格式
    if len(raw) < 48:
        return None

    sig = raw[-32:]
    iv_enc = raw[:-32]
    computed_sig = hmac.new(SECRET_KEY, iv_enc, hashlib.sha256).digest()
    if computed_sig != sig:
        return None

    iv = iv_enc[:16]
    encrypted = iv_enc[16:]
    enc_key = hashlib.sha256(SECRET_KEY + b"_LIC_ENCRYPT_V3_6").digest()

    try:
        from Crypto.Cipher import AES as _AES
        from Crypto.Util.Padding import unpad as _unpad
    except ImportError:
        from Cryptodome.Cipher import AES as _AES
        from Cryptodome.Util.Padding import unpad as _unpad

    try:
        cipher = _AES.new(enc_key, _AES.MODE_CBC, iv)
        decrypted = _unpad(cipher.decrypt(encrypted), _AES.block_size)
        return json.loads(decrypted.decode("utf-8"))
    except Exception:
        return None


# ====================== 硬件指纹 ======================

def get_machine_fingerprint() -> Optional[str]:
    """获取本机多因子硬件指纹（CPU+硬盘+主板+网卡MAC 四元组），跨平台，shell=False防注入"""
    try:
        import subprocess

        def _first_valid(output):
            for line in output.splitlines():
                s = line.strip().replace(" ", "")
                if s and s not in ("ProcessorId", "SerialNumber"):
                    return s
            return ""

        if sys.platform == "win32":
            # Windows: wmic命令列表形式（shell=False）
            cpu = _first_valid(subprocess.check_output(["wmic", "cpu", "get", "ProcessorId"], text=True))
            disk = _first_valid(subprocess.check_output(
                ["wmic", "diskdrive", "where", "Index=0", "get", "SerialNumber"], text=True))
            board = _first_valid(subprocess.check_output(
                ["wmic", "baseboard", "get", "SerialNumber"], text=True))
            mac = ""
            try:
                mac_output = subprocess.check_output(
                    ["wmic", "nic", "where", "NetEnabled=true", "get", "MACAddress"], text=True)
                for line in mac_output.splitlines():
                    m = line.strip().replace(":", "").replace("-", "")
                    if m and m != "MACAddress":
                        mac = m
                        break
            except Exception:
                pass
        else:
            # Linux/macOS: 跨平台指纹
            import platform as _plat
            import uuid as _uuid
            cpu = _plat.processor() or _plat.machine()
            disk = str(_uuid.getnode())
            board = ""
            mac_hex = "%012x" % _uuid.getnode()
            mac = mac_hex

            if sys.platform == "darwin":
                try:
                    sp_output = subprocess.check_output(
                        ["system_profiler", "SPHardwareDataType"], text=True, timeout=10)
                    for line in sp_output.splitlines():
                        if "Serial Number" in line:
                            board = line.split(":")[1].strip()
                            break
                except Exception:
                    pass

        parts = [p for p in [cpu, disk, board, mac] if p]
        return "|".join(parts) if len(parts) >= 2 else None
    except Exception:
        return None


def get_machine_name() -> str:
    """获取计算机名"""
    import platform
    return platform.node()


# ====================== HMAC签名 ======================

def sign_request(body: str, timestamp: str, nonce: str) -> str:
    """生成客户端HMAC签名"""
    message = f"{timestamp}:{nonce}:{body}"
    return hmac.new(CLIENT_SECRET.encode(), message.encode(), hashlib.sha256).hexdigest()


# ====================== v3.4: Cython 编译存根 ======================
# get_default_features() 实际由打包工具 inject_online_config() 注入
# 此存根仅在开发模式（未注入时）提供默认值，避免 Cython "undeclared name" 错误
def get_default_features():
    """获取打包时预设的功能开关（开发模式默认全开）"""
    return {
        "perceive": True, "knowledge": True, "graph": True,
        "memory": True, "reasoning": True, "association": True,
        "api_access": True, "export": True, "batch": True, "advanced": True
    }

# ====================== 功能开关 ======================

def load_local_features() -> dict:
    """加载本地功能开关配置"""
    # 优先从.features_switches文件读取
    if FEATURES_FILE.exists():
        try:
            return json.loads(FEATURES_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, TypeError):
            pass

    # 从license.lic中读取（v3.6.1: 支持加密二进制格式）
    if LIC_FILE.exists():
        try:
            lic = decrypt_license_file_content()
            if lic and "data" in lic and "feature_switches" in lic["data"]:
                return lic["data"]["feature_switches"]
        except Exception:
            pass

    # 从打包注入的默认值读取
    # v3.4: get_default_features() 由打包工具在 inject_online_config() 时注入
    # Cython 编译时需要此存根以避免 "undeclared name" 错误
    try:
        return get_default_features()
    except NameError:
        pass

    # 最终默认值
    return {"perceive": True, "knowledge": True, "graph": False}


def save_local_features(features: dict):
    """保存功能开关到本地"""
    with open(FEATURES_FILE, "w", encoding="utf-8") as f:
        json.dump(features, f, ensure_ascii=False, indent=2)


def is_feature_enabled(feature_key: str) -> bool:
    """检查某个功能是否启用"""
    features = load_local_features()
    return features.get(feature_key, False)


# ====================== 在线授权类 ======================

class OnlineLicense:
    """左脑在线授权 v3.0：自动激活 + 在线验证 + 心跳 + 续期 + 功能开关 + 激活码 + RSA+AES解密 + 预刷新 + 降级策略 + 换绑审批"""

    def __init__(self):
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._heartbeat_stop = threading.Event()
        self._cache_hours = CACHE_HOURS_FORMAL
        self._heartbeat_hours = HEARTBEAT_HOURS_FORMAL
        self._feature_switches = load_local_features()
        self._license_token = None
        # v3.0 新增属性
        self._urgent_renew = False       # 紧急续费标记（3天内到期）
        self._auto_renewed = False       # 自动续期标记（服务器预刷新成功）
        self._degraded = False           # 降级模式标记
        self._status_message = ""
        self._heartbeat_fail_count = 0  # v3.4        # 当前状态消息

    # ----- 核心方法 -----

    def activate(self, order_key: str = "", fingerprint: str = None,
                 activation_code: str = "") -> Dict:
        """首次激活：上传指纹+订单号（或激活码），获取加密license → 自动保存"""
        if not fingerprint:
            fingerprint = get_machine_fingerprint()
        if not fingerprint:
            return {"code": -1, "message": "无法获取硬件指纹"}

        if not order_key and not activation_code:
            return {"code": -1, "message": "请提供订单号或激活码"}

        body_data = {
            "order_key": order_key,
            "fingerprint": fingerprint,
            "machine_name": get_machine_name(),
            "client_version": "3.12",
            "activation_code": activation_code
        }
        body = json.dumps(body_data)
        result = self._post("/api/v1/activate", body)
        if result.get("code") == 0:
            data = result["data"]
            # v3.0: 尝试RSA+AES解密license_data
            license_data = self._decrypt_license_data(data["license_data"])
            # 保存 license.lic
            self._save_license(license_data)
            # 保存 token
            self._save_token(data["license_token"])
            self._license_token = data["license_token"]
            # 更新缓存参数
            self._cache_hours = data.get("cache_hours", CACHE_HOURS_FORMAL)
            self._heartbeat_hours = data.get("heartbeat_hours", HEARTBEAT_HOURS_FORMAL)
            # 更新功能开关
            if "feature_switches" in data:
                self._feature_switches = data["feature_switches"]
                save_local_features(data["feature_switches"])
            # 保存缓存时间戳
            self._save_cache_timestamp()
            # 启动心跳线程
            self._start_heartbeat(data["license_token"])
            # 激活成功，清除降级标记
            self._clear_degradation()
            # 更新状态
            self._status_message = "激活成功"
            self._urgent_renew = False

        return result

    def activate_by_code(self, activation_code: str, fingerprint: str = None) -> Dict:
        """通过激活码激活"""
        return self.activate(activation_code=activation_code, fingerprint=fingerprint)

    def verify_online(self) -> Dict:
        """在线验证 license 是否有效（含吊销检测 + 功能开关 + 预刷新）"""
        token = self._load_token()
        if not token:
            return {"code": -1, "message": "未找到 License Token"}

        body = json.dumps({"license_token": token})
        result = self._post("/api/v1/verify", body)
        if result.get("code") == 0 and result.get("data", {}).get("valid"):
            self._save_cache_timestamp()
            # 更新功能开关
            if "feature_switches" in result.get("data", {}):
                self._feature_switches = result["data"]["feature_switches"]
                save_local_features(result["data"]["feature_switches"])

            # v3.0: 预刷新逻辑
            data = result.get("data", {})

            # 1. 如果服务器自动续期成功，更新本地license
            if data.get("auto_renewed"):
                self._auto_renewed = True
                if data.get("license_data"):
                    license_data = self._decrypt_license_data(data["license_data"])
                    self._save_license(license_data)

            # 2. 检查剩余天数，触发预刷新
            remaining_days = data.get("remaining_days")
            if remaining_days is not None:
                if remaining_days <= RENEW_DAYS_URGENT:
                    self._urgent_renew = True
                    self._status_message = f"授权即将到期（剩余{remaining_days}天），请尽快续费"
                    # 后台静默尝试续期
                    self._silent_renew()
                elif remaining_days <= RENEW_DAYS_BEFORE_EXPIRE:
                    self._status_message = f"授权将在{remaining_days}天后到期，建议续费"
                    self._silent_renew()
                else:
                    self._urgent_renew = False
                    self._status_message = "授权有效"

            # 在线验证成功，清除降级标记
            self._clear_degradation()

        elif result.get("code") == -1:
            # 网络错误，进入降级模式
            self._extend_degradation()

        return result

    def verify_offline(self) -> Dict:
        """离线验证：检查本地 license.lic + 缓存有效期 + 功能开关 + 降级延展
        v3.6.1: 使用 _decrypt_license_file() 解密二进制格式，兼容明文JSON
        """
        if not LIC_FILE.exists():
            return {"code": -1, "message": "未找到 license.lic"}

        # v3.6.1: 解密读取（替代 json.load()，支持二进制加密格式）
        lic = self._decrypt_license_file()
        if lic is None:
            return {"code": -2, "message": "license.lic 格式损坏或被篡改"}

        # 1. HMAC签名验证
        if "data" not in lic or "signature" not in lic:
            return {"code": -2, "message": "license.lic 格式不正确"}
        raw = json.dumps(lic["data"], sort_keys=True, ensure_ascii=False).encode("utf-8")
        sig = hmac.new(SECRET_KEY, raw, hashlib.sha256).hexdigest()
        if sig != lic["signature"]:
            return {"code": -3, "message": "license.lic 已被篡改"}

        # 2. 指纹验证
        fp = get_machine_fingerprint()
        if fp and lic["data"].get("fingerprint") != "ONLINE_PENDING" and fp != lic["data"].get("fingerprint"):
            return {"code": -4, "message": "机器不匹配"}

        # 3. 过期验证（含降级延展）
        try:
            exp = datetime.fromisoformat(lic["data"]["expire_at"])
        except (KeyError, ValueError):
            return {"code": -2, "message": "license.lic 数据异常"}

        # v3.0: 检查降级延展
        degradation_exp = self._check_degradation(exp)
        if datetime.now() > degradation_exp:
            return {"code": -5, "message": f"授权已于 {lic['data'].get('expire_at', '未知')[:10]} 过期"}

        # v3.0: 检查剩余天数，设置紧急标记
        remaining = degradation_exp - datetime.now()
        remaining_days = remaining.days
        if remaining_days <= RENEW_DAYS_URGENT:
            self._urgent_renew = True
            self._status_message = f"授权即将到期（剩余{remaining_days}天），请尽快续费"
        elif remaining_days <= RENEW_DAYS_BEFORE_EXPIRE:
            self._status_message = f"授权将在{remaining_days}天后到期，建议续费"

        # 4. 缓存有效期检查
        cache_ts = self._load_cache_timestamp()
        product_type = lic["data"].get("product_type", "formal")
        max_cache = CACHE_HOURS_FORMAL if product_type == "formal" else CACHE_HOURS_TRIAL
        if cache_ts:
            elapsed_hours = (time.time() - cache_ts) / 3600
            if elapsed_hours > max_cache:
                return {"code": -6, "message": f"离线缓存已过期({elapsed_hours:.0f}h/{max_cache}h)，请联网验证"}

        # 5. 功能开关（从license读取）
        if "feature_switches" in lic["data"]:
            self._feature_switches = lic["data"]["feature_switches"]
            save_local_features(lic["data"]["feature_switches"])

        return {"code": 0, "message": "离线验证通过", "data": lic["data"]}

    def verify(self) -> Dict:
        """智能验证：先尝试在线，失败则降级离线"""
        try:
            result = self.verify_online()
            if result.get("code") == 0:
                return result
        except Exception:
            pass
        return self.verify_offline()

    def heartbeat(self) -> Dict:
        """心跳上报（含功能开关远程更新 + 预刷新）"""
        token = self._load_token()
        if not token:
            return {"code": -1, "message": "未找到 License Token"}

        body = json.dumps({"license_token": token})
        result = self._post("/api/v1/heartbeat", body)
        if result.get("code") == 0:
            self._save_cache_timestamp()
            # 更新功能开关（远程动态更新）
            if "feature_switches" in result.get("data", {}):
                new_features = result["data"]["feature_switches"]
                if new_features != self._feature_switches:
                    self._feature_switches = new_features
                    save_local_features(new_features)

            # v3.0: 预刷新逻辑
            data = result.get("data", {})

            # 心跳返回auto_renewed=true时，自动更新本地license
            if data.get("auto_renewed"):
                self._auto_renewed = True
                if data.get("license_data"):
                    license_data = self._decrypt_license_data(data["license_data"])
                    self._save_license(license_data)

            # 检查剩余天数
            remaining_days = data.get("remaining_days")
            if remaining_days is not None:
                if remaining_days <= RENEW_DAYS_URGENT:
                    self._urgent_renew = True
                    self._status_message = f"授权即将到期（剩余{remaining_days}天），请尽快续费"
                    self._silent_renew()
                elif remaining_days <= RENEW_DAYS_BEFORE_EXPIRE:
                    self._status_message = f"授权将在{remaining_days}天后到期，建议续费"
                    self._silent_renew()
                else:
                    self._urgent_renew = False

            # 在线心跳成功，清除降级标记
            self._clear_degradation()

        elif result.get("code") == -1:
            # 网络错误，进入降级模式
            self._extend_degradation()

        return result

    def renew(self, order_key: str) -> Dict:
        """续期"""
        token = self._load_token()
        if not token:
            return {"code": -1, "message": "未找到 License Token"}

        body = json.dumps({"order_key": order_key, "license_token": token})
        result = self._post("/api/v1/renew", body)
        if result.get("code") == 0:
            data = result.get("data", {})
            if data.get("license_data"):
                # v3.0: 尝试RSA+AES解密
                license_data = self._decrypt_license_data(data["license_data"])
                self._save_license(license_data)
            self._save_cache_timestamp()
            # 更新功能开关
            if "feature_switches" in data:
                self._feature_switches = data["feature_switches"]
                save_local_features(data["feature_switches"])
            # 续期成功，清除紧急标记和降级标记
            self._urgent_renew = False
            self._auto_renewed = True
            self._status_message = "续期成功"
            self._clear_degradation()
        return result

    def rebind(self, order_key: str, new_fingerprint: str = None) -> Dict:
        """换绑机器（v3.0: 审批制，不再直接换绑成功）"""
        if not new_fingerprint:
            new_fingerprint = get_machine_fingerprint()
        if not new_fingerprint:
            return {"code": -1, "message": "无法获取新机器指纹"}

        body = json.dumps({
            "order_key": order_key,
            "new_fingerprint": new_fingerprint,
            "machine_name": get_machine_name()
        })
        result = self._post("/api/v1/rebind", body)
        if result.get("code") == 0:
            data = result.get("data", {})
            status = data.get("status", "")

            if status == "pending":
                # v3.0: 换绑申请已提交，等待管理员审批
                self._status_message = "换绑申请已提交，等待管理员审批"
                return {
                    "code": 0,
                    "message": "换绑申请已提交，等待管理员审批",
                    "data": {"status": "pending", "rebind_id": data.get("rebind_id", "")}
                }

            # 审批通过（管理员已即时审批），走原有换绑成功逻辑
            if data.get("license_data"):
                license_data = self._decrypt_license_data(data["license_data"])
                self._save_license(license_data)
            if data.get("license_token"):
                self._save_token(data["license_token"])
            self._save_cache_timestamp()
            self._status_message = "换绑成功"
        return result

    def check_rebind_status(self, rebind_id: str = "") -> Dict:
        """查询换绑审批状态

        Args:
            rebind_id: 换绑申请ID，如果为空则用token查询最新申请

        Returns:
            dict: 包含 status (pending/approved/rejected) 和相关信息
        """
        token = self._load_token()
        if not token and not rebind_id:
            return {"code": -1, "message": "未找到 License Token 或 rebind_id"}

        body_data = {"license_token": token or ""}
        if rebind_id:
            body_data["rebind_id"] = rebind_id

        body = json.dumps(body_data)
        result = self._post("/api/v1/rebind_status", body)
        if result.get("code") == 0:
            data = result.get("data", {})
            status = data.get("status", "")

            if status == "approved":
                # 审批通过，更新本地license
                if data.get("license_data"):
                    license_data = self._decrypt_license_data(data["license_data"])
                    self._save_license(license_data)
                if data.get("license_token"):
                    self._save_token(data["license_token"])
                self._status_message = "换绑审批已通过"
            elif status == "pending":
                self._status_message = "换绑申请审批中，请耐心等待"
            elif status == "rejected":
                self._status_message = f"换绑申请被拒绝：{data.get('reason', '原因未知')}"

        return result

    # ----- 功能开关 -----

    def get_features(self) -> dict:
        """获取当前功能开关"""
        return self._feature_switches

    def is_feature_enabled(self, feature_key: str) -> bool:
        """检查功能是否启用"""
        return self._feature_switches.get(feature_key, False)

    def refresh_features(self) -> Dict:
        """从服务器刷新功能开关"""
        token = self._load_token()
        if not token:
            return {"code": -1, "message": "未找到 License Token"}

        body = json.dumps({"license_token": token})
        result = self._post("/api/v1/features", body)
        if result.get("code") == 0:
            features = result["data"].get("feature_switches", {})
            self._feature_switches = features
            save_local_features(features)
        return result

    # ----- v3.0: RSA+AES 嵌套解密 -----

    def _decrypt_license_data(self, license_data) -> dict:
        """解密license数据（v3.6: RSA公钥验证签名+AES解密，替代v3.0私钥解密）

        v3.6 加密方向反转：
          - 服务器：RSA私钥签名 → AES加密license → 返回 {signed_hash, encrypted_data, iv}
          - 客户端：RSA公钥验证签名 → AES解密 → 得到明文license

        兼容v3.0旧格式（含encrypted_key字段）但会拒绝并提示升级服务器

        Raises:
            ValueError: RSA验证失败或密钥不匹配
            ImportError: 缺少加密库
            RuntimeError: 其他解密异常
        """
        # 兼容v2.0：如果不是dict或不含加密字段，直接返回
        if not isinstance(license_data, dict):
            return license_data

        # v3.6 新格式：服务器用RSA私钥签名，客户端用公钥验证
        if "signed_hash" in license_data:
            return self._verify_and_decrypt_v36(license_data)

        # v3.0 旧格式兼容：含encrypted_key字段（RSA私钥解密）
        if "encrypted_key" in license_data:
            return self._decrypt_legacy_v30(license_data)

        # 无加密字段，直接返回（明文模式）
        return license_data

    def _verify_and_decrypt_v36(self, license_data: dict) -> dict:
        """v3.6: RSA公钥验证签名 + AES-GCM解密"""
        if not RSA_PUBLIC_KEY_PEM:
            raise ValueError("RSA公钥未配置，无法验证license签名")

        try:
            from cryptography.hazmat.primitives.asymmetric import padding as _asym_padding
            from cryptography.hazmat.primitives import hashes as _hashes
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            raise ImportError("缺少cryptography库，请运行: pip install cryptography")

        try:
            # Step 1: RSA公钥验证签名
            signed_hash_b64 = license_data.get("signed_hash", "")
            signed_hash_bytes = base64.b64decode(signed_hash_b64)

            public_key = serialization.load_pem_public_key(
                RSA_PUBLIC_KEY_PEM.encode("utf-8") if isinstance(RSA_PUBLIC_KEY_PEM, str) else RSA_PUBLIC_KEY_PEM
            )

            aes_key_sig_b64 = license_data.get("aes_key_sig", "")
            aes_key_sig_bytes = base64.b64decode(aes_key_sig_b64) if aes_key_sig_b64 else b""

            try:
                public_key.verify(
                    signed_hash_bytes,
                    aes_key_sig_bytes,
                    _asym_padding.PSS(
                        mgf=_asym_padding.MGF1(algorithm=_hashes.SHA256()),
                        salt_length=_asym_padding.PSS.MAX_LENGTH
                    ),
                    _hashes.SHA256()
                )
            except Exception as e:
                raise ValueError(f"RSA签名验证失败（license可能被篡改）: {str(e)[:80]}")

            # Step 2: AES密钥派生
            aes_key = hashlib.sha256(signed_hash_bytes + AES_KEY_SALT).digest()[:32]

            # Step 3: AES-GCM解密
            encrypted_data_b64 = license_data.get("encrypted_data", "")
            iv_b64 = license_data.get("iv", "")
            encrypted_data_bytes = base64.b64decode(encrypted_data_b64)
            iv_bytes = base64.b64decode(iv_b64) if iv_b64 else b'\x00' * 12

            aesgcm = AESGCM(aes_key)
            decrypted_bytes = aesgcm.decrypt(iv_bytes, encrypted_data_bytes, None)
            decrypted_str = decrypted_bytes.decode("utf-8")

            return json.loads(decrypted_str)

        except ValueError:
            raise
        except ImportError:
            raise
        except Exception as e:
            raise RuntimeError(f"license v3.6解密异常: {str(e)}")

    @staticmethod
    def _verify_and_decrypt_v36_static(license_data: dict) -> dict:
        """v3.11.4: 静态版 RSA+AES 解密，供 decrypt_license_file_content() 无实例调用"""
        if not RSA_PUBLIC_KEY_PEM:
            raise ValueError("RSA公钥未配置")

        try:
            from cryptography.hazmat.primitives.asymmetric import padding as _asym_padding
            from cryptography.hazmat.primitives import hashes as _hashes
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            raise ImportError("缺少cryptography库")

        signed_hash_bytes = base64.b64decode(license_data.get("signed_hash", ""))
        aes_key_sig_bytes = base64.b64decode(license_data.get("aes_key_sig", "")) if license_data.get("aes_key_sig") else b""
        public_key = serialization.load_pem_public_key(
            RSA_PUBLIC_KEY_PEM.encode("utf-8") if isinstance(RSA_PUBLIC_KEY_PEM, str) else RSA_PUBLIC_KEY_PEM
        )
        public_key.verify(
            signed_hash_bytes, aes_key_sig_bytes,
            _asym_padding.PSS(mgf=_asym_padding.MGF1(algorithm=_hashes.SHA256()), salt_length=_asym_padding.PSS.MAX_LENGTH),
            _hashes.SHA256()
        )
        aes_key = hashlib.sha256(signed_hash_bytes + AES_KEY_SALT).digest()[:32]
        encrypted_data_bytes = base64.b64decode(license_data.get("encrypted_data", ""))
        iv_bytes = base64.b64decode(license_data.get("iv", "")) if license_data.get("iv") else b'\x00' * 12
        aesgcm = AESGCM(aes_key)
        decrypted_bytes = aesgcm.decrypt(iv_bytes, encrypted_data_bytes, None)
        return json.loads(decrypted_bytes.decode("utf-8"))

    def _decrypt_legacy_v30(self, license_data: dict) -> dict:
        """v3.0旧格式兼容：RSA私钥解密（v3.6已废弃）"""
        raise ValueError(
            "收到v3.0旧格式加密license，但客户端v3.6已移除RSA私钥。"
            "请联系卖家升级授权服务器至v3.6+版本"
        )

    # ----- v3.0: 预刷新逻辑 -----

    def _silent_renew(self):
        """后台静默续期（remaining_days<=7时自动尝试）

        如果本地有order_key信息，尝试自动调用renew。
        此方法不会抛出异常，失败时静默处理。
        """
        try:
            # v3.6.1: 从加密license中获取order_key（支持二进制格式）
            if not LIC_FILE.exists():
                return
            lic = decrypt_license_file_content()
            if not lic:
                return
            order_key = lic.get("data", {}).get("order_key", "")
            if not order_key:
                return

            # 静默续期
            result = self.renew(order_key)
            if result.get("code") == 0:
                self._auto_renewed = True
        except Exception:
            # 静默续期失败不影响主流程
            pass

    # ----- v3.0: 降级策略 -----

    def _extend_degradation(self):
        """延长降级缓存（v3.3: 增加连续降级次数限制，防免费续期漏洞）

        服务器不可达时，本地缓存自动延长。
        将降级延长时间保存到.degradation文件。
        连续降级超过 DEGRADATION_MAX_CONSECUTIVE 次后，不再延长，必须联网验证。
        """
        self._degraded = True

        degradation_info = self._load_degradation()
        total_extended_hours = degradation_info.get("total_extended_hours", 0)
        consecutive_count = degradation_info.get("consecutive_count", 0)
        max_extended_hours = DEGRADATION_MAX_DAYS * 24

        # v3.3: 检查连续降级次数
        if consecutive_count >= DEGRADATION_MAX_CONSECUTIVE:
            self._status_message = f"连续降级次数已达上限（{DEGRADATION_MAX_CONSECUTIVE}次），必须联网验证"
            return

        if total_extended_hours >= max_extended_hours:
            # 已达最大降级天数，不再延长
            self._status_message = f"降级缓存已达上限（{DEGRADATION_MAX_DAYS}天），请尽快联网验证"
            return

        # 延长指定小时数
        new_total = total_extended_hours + DEGRADATION_EXTEND_HOURS
        if new_total > max_extended_hours:
            new_total = max_extended_hours

        degradation_info["total_extended_hours"] = new_total
        degradation_info["last_extended_at"] = datetime.now().isoformat()
        degradation_info["extended_count"] = degradation_info.get("extended_count", 0) + 1
        degradation_info["consecutive_count"] = consecutive_count + 1  # v3.3: 连续降级计数

        with open(DEGRADATION_FILE, "w", encoding="utf-8") as f:
            json.dump(degradation_info, f, ensure_ascii=False, indent=2)

        self._status_message = f"服务器不可达，降级缓存已延长（累计{new_total}小时，连续第{consecutive_count + 1}次）"

    def _check_degradation(self, original_expire: datetime) -> datetime:
        """检查降级延展，返回考虑降级后的实际过期时间

        Args:
            original_expire: license原始过期时间

        Returns:
            datetime: 考虑降级延展后的实际过期时间
        """
        if not DEGRADATION_FILE.exists():
            return original_expire

        degradation_info = self._load_degradation()
        total_extended_hours = degradation_info.get("total_extended_hours", 0)
        if total_extended_hours <= 0:
            return original_expire

        # 延长过期时间
        extended_expire = original_expire + timedelta(hours=total_extended_hours)
        return extended_expire

    def _clear_degradation(self):
        """清除降级标记（在线恢复后自动调用，v3.6: 30天窗口限制重置次数）"""
        self._degraded = False
        if DEGRADATION_FILE.exists():
            try:
                info = self._load_degradation()
                # v3.6: 检查30天窗口内重置次数
                resets_in_window = info.get("reset_history", [])
                # 只保留30天内的记录
                cutoff = (datetime.now() - timedelta(days=DEGRADATION_WINDOW_DAYS)).isoformat()
                resets_in_window = [r for r in resets_in_window if r > cutoff]

                if len(resets_in_window) >= DEGRADATION_MAX_RESETS_IN_WINDOW:
                    # 窗口内重置次数已达上限，不允许再次重置连续计数
                    self._status_message = (
                        f"30天内联网恢复已达{DEGRADATION_MAX_RESETS_IN_WINDOW}次上限，"
                        "连续降级计数不再重置"
                    )
                    # 仍然标记在线恢复时间，但不重置consecutive_count
                    info["last_online_at"] = datetime.now().isoformat()
                    info["reset_history"] = resets_in_window
                else:
                    # 正常重置
                    info["consecutive_count"] = 0
                    info["last_online_at"] = datetime.now().isoformat()
                    resets_in_window.append(datetime.now().isoformat())
                    info["reset_history"] = resets_in_window

                with open(DEGRADATION_FILE, "w", encoding="utf-8") as f:
                    json.dump(info, f, ensure_ascii=False, indent=2)
            except Exception:
                try:
                    DEGRADATION_FILE.unlink()
                except Exception:
                    pass

    def _load_degradation(self) -> dict:
        """加载降级信息

        Returns:
            dict: 降级信息，包含 total_extended_hours, last_extended_at, extended_count
        """
        if DEGRADATION_FILE.exists():
            try:
                with open(DEGRADATION_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, KeyError):
                pass
        return {"total_extended_hours": 0, "last_extended_at": "", "extended_count": 0}

    # ----- v3.0: GUI提示接口 -----

    def need_renew_alert(self) -> bool:
        """是否需要续费提醒（3天内到期）

        供启动左脑.py调用，判断是否弹窗提醒用户续费。

        Returns:
            bool: True表示需要弹窗提醒续费
        """
        return self._urgent_renew

    def need_activate_prompt(self) -> bool:
        """是否需要激活提示（无license）

        供启动左脑.py调用，判断是否弹窗提示用户激活。

        Returns:
            bool: True表示需要弹窗提示激活
        """
        return not LIC_FILE.exists()

    def get_status_message(self) -> str:
        """获取当前状态消息（用于弹窗）

        供启动左脑.py调用，获取当前授权状态消息。

        Returns:
            str: 当前状态消息
        """
        if self._status_message:
            return self._status_message

        # 根据当前状态生成默认消息
        if not LIC_FILE.exists():
            return "未激活，请先激活授权"
        if self._degraded:
            return "服务器不可达，当前使用降级缓存"
        if self._urgent_renew:
            return "授权即将到期，请尽快续费"
        if self._auto_renewed:
            return "授权已自动续期"
        return "授权正常"

    # ----- 心跳线程 -----

    def _start_heartbeat(self, token: str):
        """启动后台心跳线程（v3.6: atexit注册清理）"""
        self._stop_heartbeat()
        self._heartbeat_stop.clear()

        def _heartbeat_loop():
            while not self._heartbeat_stop.is_set():
                interval = self._heartbeat_hours * 3600
                self._heartbeat_stop.wait(interval)
                if self._heartbeat_stop.is_set():
                    break
                try:
                    result = self.heartbeat()
                    if result.get("data", {}).get("valid") is False:
                        break
                except Exception:
                    pass

        self._heartbeat_thread = threading.Thread(target=_heartbeat_loop, daemon=True)
        self._heartbeat_thread.start()
        # v3.6: 注册atexit清理，确保主进程退出时停止心跳线程
        import atexit
        atexit.register(self._stop_heartbeat)

    def _stop_heartbeat(self):
        """停止心跳线程"""
        self._heartbeat_stop.set()
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            self._heartbeat_thread.join(timeout=5)

    # ----- HTTP 请求 -----

    def _post(self, path: str, body_str: str) -> Dict:
        """发送带HMAC签名的POST请求（v3.3: 仅HTTPS，移除HTTP降级防中间人攻击）"""
        import urllib.request
        import urllib.error
        import ssl

        timestamp = str(time.time())
        nonce = str(uuid.uuid4())
        signature = sign_request(body_str, timestamp, nonce)

        url = f"{SERVER_URL}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": CLIENT_API_KEY,
            "X-Signature": signature,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce
        }

        req = urllib.request.Request(url, data=body_str.encode("utf-8"), headers=headers)
        try:
            ctx = ssl.create_default_context()
            # v3.6.1→v3.7 内建化: 服务器自签名CA证书从 _keys.pyd 内核常量加载
            # 不再依赖散落 server_ca.pem 文件（IDENTITY.md 内核层定位）
            # Python 3.4+ 支持 load_verify_locations(cadata=PEM字符串)
            ctx.load_verify_locations(cadata=SERVER_CA_PEM)
            ctx.check_hostname = False  # IP地址无法匹配证书CN，跳过hostname检查
            ctx.verify_mode = ssl.CERT_REQUIRED  # 仍验证证书链，仅信任已知CA
            resp = urllib.request.urlopen(req, timeout=10, context=ctx)
            return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            try:
                err = json.loads(e.read())
                return {"code": e.code, "message": err.get("detail", str(e))}
            except Exception:
                return {"code": e.code, "message": str(e)}
        except Exception as e:
            # v3.3: 移除HTTP降级，所有连接失败统一返回网络错误
            return {"code": -1, "message": f"网络错误: 无法连接到授权服务器 ({type(e).__name__})"}

    # ----- 本地存储 -----

    def _decrypt_license_file(self) -> dict:
        """解密本地 license.lic（v3.6.1: 调用独立函数 decrypt_license_file_content）"""
        return decrypt_license_file_content()

    def _save_license(self, license_data: dict):
        """保存 license.lic（v3.6: 加密二进制格式，防篡改）

        格式变化：明文JSON → AES-256-CBC加密二进制 + HMAC签名
        保存为二进制文件而非明文JSON，用户无法直接打开编辑篡改。
        """
        # 先构建标准格式（含 data + signature）
        if isinstance(license_data, dict) and "data" in license_data and "signature" in license_data:
            lic_json = license_data
        elif isinstance(license_data, dict):
            data_str = json.dumps(license_data, sort_keys=True, ensure_ascii=False).encode("utf-8")
            signature = hmac.new(SECRET_KEY, data_str, hashlib.sha256).hexdigest()
            lic_json = {"data": license_data, "signature": signature}
        else:
            # 兜底：直接保存为JSON（格式可能不对，但保留原始数据）
            with open(LIC_FILE, "w", encoding="utf-8") as f:
                json.dump(license_data, f, ensure_ascii=False, indent=2)
            return

        # v3.6: 加密保存（强制AES，无XOR回退）
        enc_key = hashlib.sha256(SECRET_KEY + b"_LIC_ENCRYPT_V3_6").digest()
        raw = json.dumps(lic_json, ensure_ascii=False).encode("utf-8")
        iv = os.urandom(16)
        try:
            from Crypto.Cipher import AES as _AES
            from Crypto.Util.Padding import pad as _pad
        except ImportError:
            from Cryptodome.Cipher import AES as _AES
            from Cryptodome.Util.Padding import pad as _pad
        cipher = _AES.new(enc_key, _AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(_pad(raw, _AES.block_size))
        # HMAC签名（覆盖IV+加密数据）
        sig = hmac.new(SECRET_KEY, iv + encrypted, hashlib.sha256).digest()
        binary_data = iv + encrypted + sig
        with open(LIC_FILE, "wb") as f:
            f.write(binary_data)

    def _load_token(self) -> Optional[str]:
        """读取 License Token（兼容原始字符串和 JSON 两种格式）"""
        try:
            if TOKEN_FILE.exists():
                raw = TOKEN_FILE.read_text(encoding="utf-8").strip()
                # v3.4: 兼容 JSON 格式 {"license_token": "..."}
                if raw.startswith("{"):
                    data = json.loads(raw)
                    return data.get("license_token", "")
                return raw
        except Exception:
            pass
        return None

    def _save_token(self, token: str):
        """保存 License Token（JSON 格式，便于扩展）"""
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump({"license_token": token}, f, ensure_ascii=False)

    def _save_cache_timestamp(self):
        """保存缓存时间戳"""
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            f.write(str(time.time()))

    def _load_cache_timestamp(self) -> Optional[float]:
        """读取缓存时间戳"""
        try:
            if CACHE_FILE.exists():
                return float(CACHE_FILE.read_text(encoding="utf-8").strip())
        except Exception:
            pass
        return None


# ====================== 集成到启动左脑.py 的接口 ======================

def online_activate(order_key: str = "", activation_code: str = "") -> Dict:
    """首次激活入口（供 启动左脑.py 调用，支持订单号或激活码）"""
    ol = OnlineLicense()
    return ol.activate(order_key=order_key, activation_code=activation_code)


def online_activate_by_code(activation_code: str) -> Dict:
    """激活码激活入口"""
    ol = OnlineLicense()
    return ol.activate_by_code(activation_code)


def online_verify() -> Dict:
    """验证入口（优先在线→降级离线）"""
    ol = OnlineLicense()
    return ol.verify()


def online_renew(order_key: str) -> Dict:
    """续期入口"""
    ol = OnlineLicense()
    return ol.renew(order_key)


def online_rebind(order_key: str) -> Dict:
    """换绑入口（v3.0: 审批制）"""
    ol = OnlineLicense()
    return ol.rebind(order_key)


def online_check_rebind_status(rebind_id: str = "") -> Dict:
    """查询换绑审批状态入口"""
    ol = OnlineLicense()
    return ol.check_rebind_status(rebind_id)


def online_get_features() -> dict:
    """获取功能开关"""
    return load_local_features()


def online_is_feature_enabled(feature_key: str) -> bool:
    """检查功能是否启用"""
    return is_feature_enabled(feature_key)


def online_refresh_features() -> Dict:
    """从服务器刷新功能开关"""
    ol = OnlineLicense()
    return ol.refresh_features()


def online_need_renew_alert() -> bool:
    """是否需要续费提醒（3天内到期）"""
    ol = OnlineLicense()
    return ol.need_renew_alert()


def online_need_activate_prompt() -> bool:
    """是否需要激活提示（无license）"""
    ol = OnlineLicense()
    return ol.need_activate_prompt()


def online_get_status_message() -> str:
    """获取当前状态消息（用于弹窗）"""
    ol = OnlineLicense()
    return ol.get_status_message()


# ====================== 独立运行 ======================

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("用法: python 左脑在线授权.py <命令> [参数]")
        print("  activate <order_key>           - 首次激活（订单号）")
        print("  activate-code <激活码>         - 激活码激活")
        print("  verify                         - 验证授权")
        print("  renew <order_key>              - 续期")
        print("  rebind <order_key>             - 换绑（v3.0审批制）")
        print("  rebind-status [rebind_id]      - 查询换绑审批状态")
        print("  fingerprint                    - 查看本机指纹")
        print("  status                         - 查看授权状态")
        print("  features                       - 查看功能开关")
        print("  refresh-features               - 刷新功能开关")
        print("  alert                          - 查看是否需要续费提醒")
        print("  activate-prompt                - 查看是否需要激活提示")
        print("  status-message                 - 查看当前状态消息")
        sys.exit(1)

    cmd = sys.argv[1]
    ol = OnlineLicense()

    if cmd == "activate" and len(sys.argv) >= 3:
        result = ol.activate(order_key=sys.argv[2])
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "activate-code" and len(sys.argv) >= 3:
        result = ol.activate_by_code(sys.argv[2])
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "verify":
        result = ol.verify()
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "renew" and len(sys.argv) >= 3:
        result = ol.renew(sys.argv[2])
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "rebind" and len(sys.argv) >= 3:
        result = ol.rebind(sys.argv[2])
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "rebind-status":
        rebind_id = sys.argv[2] if len(sys.argv) >= 3 else ""
        result = ol.check_rebind_status(rebind_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "fingerprint":
        fp = get_machine_fingerprint()
        print(f"本机指纹: {fp}")

    elif cmd == "status":
        result = ol.verify_offline()
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "features":
        features = load_local_features()
        print("当前功能开关:")
        for k, v in features.items():
            status_text = "\u2713 \u5df2\u542f\u7528" if v else "\u2717 \u672a\u542f\u7528"
            print(f"  {k}: {status_text}")

    elif cmd == "refresh-features":
        result = ol.refresh_features()
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "alert":
        need = ol.need_renew_alert()
        print(f"需要续费提醒: {'是' if need else '否'}")

    elif cmd == "activate-prompt":
        need = ol.need_activate_prompt()
        print(f"需要激活提示: {'是' if need else '否'}")

    elif cmd == "status-message":
        msg = ol.get_status_message()
        print(f"当前状态: {msg}")

    else:
        print(f"未知命令: {cmd}")


# ====================== v2.0 功能开关配置（打包时注入） ======================
DEFAULT_FEATURE_SWITCHES = {"perceive": True, "knowledge": True, "graph": True}

def get_default_features():
    """获取打包时预设的功能开关"""
    return DEFAULT_FEATURE_SWITCHES.copy()


# ====================== v3.7 功能开关配置（打包时注入，密钥已内建） ======================
DEFAULT_FEATURE_SWITCHES = {"perceive": True, "knowledge": True, "graph": True}

def get_default_features():
    """获取打包时预设的功能开关"""
    return DEFAULT_FEATURE_SWITCHES.copy()
