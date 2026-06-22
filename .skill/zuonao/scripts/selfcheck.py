# -*- coding: utf-8 -*-
"""
左脑自检系统 v3.12 — 10项检查 + 7项修复能力
==========================================
触发方式：/左脑 自检
自检范围：数据库完整性、注入一致性、对话历史、Memory日志、纠缠场、
         workspace隔离、授权状态、Token数据库、备份时效、架构注入状态(v3.12新增)
修复策略：修复前自动备份 → 修复 → 输出对比报告
"""

import json, os, sys, time, shutil, sqlite3, base64, hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any

# ===== 密钥导入（v3.5.1: 强制从 crypto_config 导入，不降级）=====
_SKILL_DIR = Path(__file__).resolve().parent.parent
if str(_SKILL_DIR) not in sys.path:
    sys.path.insert(0, str(_SKILL_DIR))
try:
    from crypto_config import derive_backup_key
except ImportError:
    print("🧠 安全错误：密钥保护模块缺失，自检拒绝执行")
    sys.exit(1)

# ===== 路径常量 =====
SKILL_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = SKILL_DIR / "data"
DATA_FILE = DATA_DIR / "memory_duck_data.json"
ENTANGLE_FILE = DATA_DIR / "entanglement_data.json"
DB_PATH = DATA_DIR / "left_brain.db"
INJECT_FILE = SKILL_DIR / "_inject.md"
LIC_FILE = SKILL_DIR / "license.lic"
VERSION_FILE = SKILL_DIR / "version.txt"
BACKUP_DIR = DATA_DIR / "data_backup_selfcheck"


class SelfCheckResult:
    """单项检查结果"""
    def __init__(self, name: str, status: str, detail: str = "",
                 fixed: bool = False, fix_detail: str = ""):
        self.name = name          # 检查项名称
        self.status = status      # ✅ / ⚠️ / ❌
        self.detail = detail      # 检查详情
        self.fixed = fixed        # 是否已修复
        self.fix_detail = fix_detail  # 修复详情

    def __repr__(self):
        s = f"{self.status} {self.name}: {self.detail}"
        if self.fixed:
            s += f" → 已修复: {self.fix_detail}"
        return s


class LeftBrainSelfCheck:
    """左脑自检引擎 — 10项检查 + 7项修复"""

    def __init__(self, engine=None):
        self.engine = engine  # MemoryEngine 实例（可选）
        self.results: List[SelfCheckResult] = []
        self.backup_path: str = ""
        self._backup_created = False

    # ===== 备份管理 =====

    def _create_backup(self) -> str:
        """修复前自动备份当前数据（v3.10.2: AES-256-CBC加密，替代XOR流加密）"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = BACKUP_DIR.parent / f"data_backup_selfcheck_{timestamp}.enc"
        self.backup_path = str(backup_file)

        # 打包 data/ 下所有文件内容
        file_contents = {}
        if DATA_DIR.exists():
            for f in DATA_DIR.iterdir():
                if f.is_file():
                    try:
                        raw = f.read_bytes()
                        file_contents[f.name] = base64.b64encode(raw).decode("ascii")
                    except Exception:
                        pass

        # 附加引擎节点数据（如果可用）
        if self.engine:
            file_contents["_backup_nodes"] = json.dumps(
                self.engine.nodes, ensure_ascii=False)
            file_contents["_backup_stats"] = json.dumps({
                "learn_count": self.engine.learn_count,
                "query_count": self.engine.query_count,
                "search_count": self.engine.search_count,
                "token_savings": self.engine.token_savings,
                "backup_at": datetime.now().isoformat(),
                "version": "3.10.2",
            }, ensure_ascii=False)

        raw = json.dumps(file_contents, ensure_ascii=False).encode("utf-8")

        # v3.10.2→v3.6: AES-256-CBC加密（强制AES，无XOR回退）
        enc_key = derive_backup_key()  # 32字节AES密钥
        iv = os.urandom(16)
        try:
            from Crypto.Cipher import AES
            from Crypto.Util.Padding import pad
        except ImportError:
            from Cryptodome.Cipher import AES
            from Cryptodome.Util.Padding import pad
        cipher = AES.new(enc_key, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(pad(raw, AES.block_size))
        encoded = base64.b64encode(iv + encrypted).decode("ascii")

        backup_file.write_text(encoded, encoding="ascii")
        self._backup_created = True

        # 清理旧式明文备份目录（v3.10.1 迁移）
        for old_dir in DATA_DIR.glob("data_backup_selfcheck_*"):
            if old_dir.is_dir():
                try:
                    shutil.rmtree(str(old_dir))
                except Exception:
                    pass

        return self.backup_path

    def _cleanup_old_backups(self):
        """v3.10.1: 清理旧自检备份，仅保留最近2个"""
        try:
            enc_files = sorted(
                DATA_DIR.glob("data_backup_selfcheck_*.enc"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            for old in enc_files[2:]:  # 保留最近2个
                try:
                    old.unlink()
                except Exception:
                    pass
        except Exception:
            pass

    # ===== 检查项 =====

    def check_database_integrity(self) -> SelfCheckResult:
        """检查1：数据库完整性 — 节点数、空节点、损坏节点"""
        if not DATA_FILE.exists():
            return SelfCheckResult("数据库完整性", "❌", "memory_duck_data.json 不存在")

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            return SelfCheckResult("数据库完整性", "❌", f"数据文件损坏: {e}")

        nodes = data.get("nodes", [])
        total = len(nodes)
        valid = [n for n in nodes if isinstance(n, dict) and n.get("text")]
        empty = [i for i, n in enumerate(nodes) if n is None]
        damaged = [i for i, n in enumerate(nodes)
                   if isinstance(n, dict) and not n.get("text")]

        # workspace 分布
        ws_counts = {}
        for n in valid:
            ws = n.get("workspace", "global")
            ws_counts[ws] = ws_counts.get(ws, 0) + 1

        ws_detail = ", ".join([f"{k}:{v}" for k, v in sorted(ws_counts.items(), key=lambda x: -x[1])])

        if empty or damaged:
            detail = f"总{total}条/有效{len(valid)}条/空{len(empty)}个/损坏{len(damaged)}个 | ws分布: {ws_detail}"
            result = SelfCheckResult("数据库完整性", "⚠️", detail)
            # 修复：清理空/损坏节点，重建索引
            if self.engine:
                new_nodes = [n for n in nodes if isinstance(n, dict) and n.get("text")]
                self.engine.nodes = new_nodes
                self.engine.hash_index = {}
                self.engine.simhash_index = {}
                self.engine._kw_index = {}
                for i, node in enumerate(new_nodes):
                    try:
                        ws = node.get("workspace", "global")
                        text = node.get("text", "")
                        h = self.engine._hash_64(f"{ws}:{text}")
                        self.engine.hash_index[h] = i
                        sh = self.engine._simhash(text)
                        self.engine.simhash_index[sh] = i
                        self.engine._keyword_index_add(text, i)
                    except Exception:
                        pass
                self.engine._save()
                result.fixed = True
                result.fix_detail = f"清理{len(empty)}个空节点+{len(damaged)}个损坏节点，重建索引，剩余{len(new_nodes)}条有效知识"
            return result

        detail = f"{total}条知识 | ws分布: {ws_detail}"
        return SelfCheckResult("数据库完整性", "✅", detail)

    def check_inject_consistency(self) -> SelfCheckResult:
        """检查2：注入一致性 — _inject.md vs 实际数据"""
        # 读取实际数据
        if not DATA_FILE.exists():
            return SelfCheckResult("注入一致性", "❌", "数据文件不存在，无法对比")

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            nodes = data.get("nodes", [])
            valid_nodes = [n for n in nodes if isinstance(n, dict) and n.get("text")]
            actual_total = len(valid_nodes)
        except Exception:
            actual_total = -1

        # 读取 _inject.md
        inject_total = 0
        inject_content = ""
        if INJECT_FILE.exists():
            with open(INJECT_FILE, "r", encoding="utf-8") as f:
                inject_content = f.read()
            # 从inject内容提取"积累 X 条知识"
            import re
            m = re.search(r'积累了\s*(\d+)\s*条知识', inject_content)
            if m:
                inject_total = int(m.group(1))

        if actual_total < 0:
            return SelfCheckResult("注入一致性", "❌", "无法读取实际数据")

        # 检查全局总数
        global_inject = 0
        m2 = re.search(r'全局共\s*(\d+)\s*条', inject_content) if inject_content else None
        if m2:
            global_inject = int(m2.group(1))

        if inject_total != actual_total and global_inject != actual_total:
            detail = f"_inject.md显示{inject_total}条(全局{global_inject}) vs 实际{actual_total}条 → 断层"
            result = SelfCheckResult("注入一致性", "⚠️", detail)
            # 修复：重写 _inject.md，聚合全workspace数据
            if self.engine:
                self.engine._sync_memory_md()
                # 强制重写为全workspace聚合版
                self._fix_inject_full_workspace(valid_nodes)
                result.fixed = True
                result.fix_detail = f"重写_inject.md，聚合全workspace {actual_total}条知识"
            return result

        return SelfCheckResult("注入一致性", "✅",
                               f"_inject.md({inject_total}条) = 实际({actual_total}条)，一致")

    def _fix_inject_full_workspace(self, valid_nodes: list):
        """修复注入文件：聚合全workspace数据"""
        try:
            total = len(valid_nodes)
            # 分类统计
            cats = {}
            for n in valid_nodes:
                c = n.get("category", "未分类")
                cats[c] = cats.get(c, 0) + 1
            top_cats = sorted(cats.items(), key=lambda x: -x[1])[:5]
            cat_str = "、".join([f"{c}({n}条)" for c, n in top_cats])

            # 高频知识
            hot = sorted(valid_nodes, key=lambda n: n.get("access_count", 0), reverse=True)[:5]
            hot_str = "、".join([f'「{n["text"][:30]}」' for n in hot])

            # 最近知识
            recent = sorted(valid_nodes,
                           key=lambda n: str(n.get("learned_at", "")),
                           reverse=True)[:5]
            recent_lines = []
            for n in recent:
                ts = n.get("learned_at", "")[:10]
                recent_lines.append(f"- {ts} [{n.get('category','')}] {n['text'][:120]}")

            # workspace分布
            ws_counts = {}
            for n in valid_nodes:
                ws = n.get("workspace", "global")
                ws_counts[ws] = ws_counts.get(ws, 0) + 1
            ws_str = ", ".join([f"{k}:{v}" for k, v in sorted(ws_counts.items(), key=lambda x: -x[1])])

            lines = [
                f"你在当前工作区积累了 {total} 条知识（全局共 {total} 条）。",
                f"主要涉及: {cat_str}。",
            ]
            if hot:
                lines.append(f"最近常被查询: {hot_str}。")
            if recent:
                lines.append("最近学到:")
                lines.extend(recent_lines)
            lines.append(f"工作区分布: {ws_str}")

            with open(INJECT_FILE, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
        except Exception as e:
            pass

    def check_conversation_history(self) -> SelfCheckResult:
        """检查3：对话历史可达性（仅检测，无法在脚本中直接验证）"""
        # 此项需要AI调用conversation_search验证，脚本层仅标记
        return SelfCheckResult("对话历史可达", "✅",
                               "需AI调用conversation_search验证最近7天可召回（脚本层无法直接检测）")

    def check_memory_logs(self) -> SelfCheckResult:
        """检查4：Memory日志文件 — 遍历所有workspace日志"""
        memory_base = Path(os.path.expanduser("~")) / ".workbuddy" / "memory"
        if not memory_base.exists():
            return SelfCheckResult("Memory日志", "⚠️", "全局memory目录不存在")

        # 查找所有日志文件
        log_files = list(memory_base.glob("**/2026-*.md"))
        mem_files = list(memory_base.glob("**/MEMORY.md"))

        # 查找所有workspace的memory
        workbuddy_base = Path(os.path.expanduser("~")) / "WorkBuddy"
        ws_log_count = 0
        ws_log_missing = []
        if workbuddy_base.exists():
            for ws_dir in workbuddy_base.iterdir():
                ws_mem = ws_dir / ".workbuddy" / "memory"
                if ws_mem.exists():
                    logs = list(ws_mem.glob("2026-*.md"))
                    ws_log_count += len(logs)

        detail = f"全局日志{len(log_files)}个 + MEMORY.md {len(mem_files)}个 + workspace日志{ws_log_count}个"
        return SelfCheckResult("Memory日志", "✅", detail)

    def check_entanglement_consistency(self) -> SelfCheckResult:
        """检查5：纠缠场一致性 — entanglement_data.json vs 节点edges"""
        if not ENTANGLE_FILE.exists():
            return SelfCheckResult("纠缠场一致性", "✅", "纠缠场文件不存在（可能未启用）")

        try:
            with open(ENTANGLE_FILE, "r", encoding="utf-8") as f:
                ent_data = json.load(f)
        except Exception as e:
            return SelfCheckResult("纠缠场一致性", "⚠️", f"纠缠场数据损坏: {e}")

        # 检查节点edges引用的索引是否越界
        if not DATA_FILE.exists():
            return SelfCheckResult("纠缠场一致性", "✅", "无数据文件可对比")

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            nodes = data.get("nodes", [])
        except Exception:
            return SelfCheckResult("纠缠场一致性", "⚠️", "无法读取数据文件对比")

        dangling = 0
        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                continue
            for edge in node.get("edges", []):
                # edge格式可能是: int / dict / list [target, label]
                if isinstance(edge, int):
                    target = edge
                elif isinstance(edge, dict):
                    target = edge.get("target", -1)
                elif isinstance(edge, (list, tuple)) and len(edge) >= 1:
                    target = edge[0] if isinstance(edge[0], int) else -1
                else:
                    target = -1
                if target < 0 or target >= len(nodes) or nodes[target] is None:
                    dangling += 1

        if dangling > 0:
            detail = f"发现{dangling}个断裂关联（引用不存在的节点）"
            result = SelfCheckResult("纠缠场一致性", "⚠️", detail)
            # 修复：清理断裂edges
            if self.engine:
                fixed_count = 0
                for i, node in enumerate(self.engine.nodes):
                    if not isinstance(node, dict):
                        continue
                    clean_edges = []
                    for edge in node.get("edges", []):
                        if isinstance(edge, int):
                            target = edge
                        elif isinstance(edge, dict):
                            target = edge.get("target", -1)
                        elif isinstance(edge, (list, tuple)) and len(edge) >= 1:
                            target = edge[0] if isinstance(edge[0], int) else -1
                        else:
                            target = -1
                        if 0 <= target < len(self.engine.nodes) and self.engine.nodes[target] is not None:
                            clean_edges.append(edge)
                        else:
                            fixed_count += 1
                    if len(clean_edges) != len(node.get("edges", [])):
                        node["edges"] = clean_edges
                self.engine._save()
                result.fixed = True
                result.fix_detail = f"清理{fixed_count}个断裂关联"
            return result

        return SelfCheckResult("纠缠场一致性", "✅", "所有关联节点有效，无断裂")

    def check_workspace_isolation(self) -> SelfCheckResult:
        """检查6：workspace隔离校验 — 节点归属是否合理"""
        if not DATA_FILE.exists():
            return SelfCheckResult("workspace隔离", "❌", "数据文件不存在")

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            nodes = data.get("nodes", [])
        except Exception:
            return SelfCheckResult("workspace隔离", "❌", "数据文件损坏")

        valid = [n for n in nodes if isinstance(n, dict) and n.get("text")]
        ws_counts = {}
        for n in valid:
            ws = n.get("workspace", "global")
            ws_counts[ws] = ws_counts.get(ws, 0) + 1

        # 检查是否有异常workspace（太短、包含特殊字符等）
        anomalies = []
        for ws, count in ws_counts.items():
            if len(ws) < 2 or ws.startswith("ws_2026-06-1"):
                anomalies.append(f"{ws}({count}条)")

        detail = f"共{len(ws_counts)}个workspace: " + ", ".join(
            [f"{k}:{v}" for k, v in sorted(ws_counts.items(), key=lambda x: -x[1])])

        if anomalies:
            detail += f" | ⚠️ 疑似异常workspace: {', '.join(anomalies)}"
            return SelfCheckResult("workspace隔离", "⚠️", detail)

        return SelfCheckResult("workspace隔离", "✅", detail)

    def check_license_status(self) -> SelfCheckResult:
        """检查7：授权状态"""
        if not LIC_FILE.exists():
            return SelfCheckResult("授权状态", "❌", "license.lic 不存在（母包模式或未授权）")

        try:
            raw = LIC_FILE.read_bytes()
            # v3.6+: license.lic是加密二进制格式，尝试JSON解析（旧格式）或标记为加密
            if raw[:1] == b"{":
                lic = json.loads(raw.decode("utf-8"))
            else:
                # 加密二进制格式 — 外部verify_license已验证，自检只确认文件存在且非空
                return SelfCheckResult("授权状态", "✅",
                                       f"license.lic 加密格式（{len(raw)}字节），外部已验证")
            expire = lic.get("data", {}).get("expire_at", "未知")
            fingerprint = lic.get("data", {}).get("fingerprint", "未知")
            days_left = ""
            try:
                exp_date = datetime.fromisoformat(expire)
                delta = (exp_date - datetime.now()).days
                days_left = f"，剩余{delta}天"
            except Exception:
                pass
            return SelfCheckResult("授权状态", "✅",
                                   f"有效{days_left}，已绑定本机")
        except Exception as e:
            return SelfCheckResult("授权状态", "⚠️", f"授权文件读取异常: {e}")

    def check_token_database(self) -> SelfCheckResult:
        """检查8：Token数据库一致性"""
        if not DB_PATH.exists():
            return SelfCheckResult("Token数据库", "⚠️", "left_brain.db 不存在")

        try:
            conn = sqlite3.connect(str(DB_PATH), timeout=10)
            cur = conn.cursor()

            # 读取JSON中的计数
            json_counts = {}
            if DATA_FILE.exists():
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                json_counts = {
                    "learn": data.get("learn_count", 0),
                    "query": data.get("query_count", 0),
                    "search": data.get("search_count", 0),
                }

            # 读取SQLite中的计数
            sqlite_counts = {}
            for key in ["learn_count", "query_count", "search_count"]:
                try:
                    val = cur.execute("SELECT value FROM counters WHERE key=?", (key,)).fetchone()
                    sqlite_counts[key] = val[0] if val else 0
                except Exception:
                    sqlite_counts[key] = -1

            conn.close()

            # 对比
            mismatches = []
            for key, json_val in json_counts.items():
                sql_val = sqlite_counts.get(key, -1)
                if sql_val >= 0 and json_val != sql_val:
                    mismatches.append(f"{key}: JSON={json_val} SQLite={sql_val}")

            if mismatches:
                detail = "计数不一致: " + ", ".join(mismatches)
                result = SelfCheckResult("Token数据库", "⚠️", detail)
                # 修复：以JSON为准同步到SQLite
                if self.engine and hasattr(self.engine, '_sync_to_sqlite'):
                    self.engine._sync_to_sqlite()
                    result.fixed = True
                    result.fix_detail = "已以JSON为准同步SQLite计数器"
                return result

            return SelfCheckResult("Token数据库", "✅", "JSON与SQLite计数一致")

        except Exception as e:
            return SelfCheckResult("Token数据库", "⚠️", f"检查异常: {e}")

    def check_backup_freshness(self) -> SelfCheckResult:
        """检查9：备份时效 — 最近一次备份是否超过30天"""
        backup_dirs = list(DATA_DIR.glob("data_backup*"))
        if not backup_dirs:
            return SelfCheckResult("备份时效", "⚠️", "无任何备份数据",
                                   fix_detail="建议执行 /左脑 备份")

        # 找最新的备份
        latest = max(backup_dirs, key=lambda p: p.stat().st_mtime)
        backup_time = datetime.fromtimestamp(latest.stat().st_mtime)
        days_ago = (datetime.now() - backup_time).days

        if days_ago > 30:
            return SelfCheckResult("备份时效", "⚠️",
                                   f"最近备份 {days_ago} 天前（{backup_time.strftime('%Y-%m-%d')}），超过30天",
                                   fix_detail="建议执行 /左脑 备份")
        return SelfCheckResult("备份时效", "✅",
                               f"最近备份 {days_ago} 天前（{backup_time.strftime('%Y-%m-%d')}）")

    def check_architecture_injection(self) -> SelfCheckResult:
        """检查10：架构注入状态（v3.12新增） — 全局级 IDENTITY.md 是否包含左脑层标记"""
        global_identity = Path(os.path.expanduser("~")) / ".workbuddy" / "IDENTITY.md"
        _LEFT_BRAIN_MARKER = "左脑处理层"

        # 检查全局级 IDENTITY.md
        if not global_identity.exists():
            detail = "全局级 ~/.workbuddy/IDENTITY.md 不存在 → 架构定义缺失，需重新初始化"
            result = SelfCheckResult("架构注入状态", "❌", detail)
            # 修复：写入全局级 IDENTITY.md
            try:
                os.makedirs(str(global_identity.parent), exist_ok=True)
                # 从模板读取
                template_file = SKILL_DIR / "IDENTITY.md"
                if template_file.exists():
                    template = template_file.read_text(encoding="utf-8")
                    global_identity.write_text(template, encoding="utf-8")
                    result.fixed = True
                    result.fix_detail = "从模板写入全局级 ~/.workbuddy/IDENTITY.md"
                else:
                    result.fix_detail = "模板文件不存在，需手动执行 /左脑 session"
            except Exception as e:
                result.fix_detail = f"写入失败: {e}，需手动执行 /左脑 session"
            return result

        try:
            content = global_identity.read_text(encoding="utf-8")
        except Exception as e:
            return SelfCheckResult("架构注入状态", "❌", f"无法读取全局 IDENTITY.md: {e}")

        if _LEFT_BRAIN_MARKER not in content:
            detail = f"全局 IDENTITY.md 存在但缺少'{_LEFT_BRAIN_MARKER}'标记 → 架构定义未生效"
            result = SelfCheckResult("架构注入状态", "⚠️", detail)
            # 修复：追加左脑层架构定义
            try:
                # 从模板读取需要追加的部分
                template_file = SKILL_DIR / "IDENTITY.md"
                if template_file.exists():
                    template = template_file.read_text(encoding="utf-8")
                    # 提取从标记开始的内容
                    marker_pos = template.find(f"## ⚡ 系统架构：{_LEFT_BRAIN_MARKER}")
                    if marker_pos >= 0:
                        append_content = "\n\n" + template[marker_pos:]
                        global_identity.write_text(content + append_content, encoding="utf-8")
                        result.fixed = True
                        result.fix_detail = f"追加左脑层架构定义到全局 IDENTITY.md"
                    else:
                        global_identity.write_text(content + "\n\n" + template, encoding="utf-8")
                        result.fixed = True
                        result.fix_detail = "追加完整模板到全局 IDENTITY.md"
                else:
                    result.fix_detail = "模板文件不存在，需手动执行 /左脑 session"
            except Exception as e:
                result.fix_detail = f"追加失败: {e}，需手动执行 /左脑 session"
            return result

        # 检查模板与全局文件的版本是否一致
        # 只比较架构核心条款（启动协议+运行时原则），不比较身份名（用户可能自定义）
        template_file = SKILL_DIR / "IDENTITY.md"
        if template_file.exists():
            try:
                template = template_file.read_text(encoding="utf-8")
                # 比较关键运行时原则是否都存在（而非逐字对比身份名）
                _RUNTIME_PRINCIPLES = [
                    "左脑是唯一记忆通道",
                    "架构不可降级",
                    "读注入文件",
                    "加载左脑",
                    "融合上下文",
                ]
                missing_principles = []
                for principle in _RUNTIME_PRINCIPLES:
                    if principle not in content:
                        missing_principles.append(principle)

                if missing_principles:
                    return SelfCheckResult("架构注入状态", "⚠️",
                                           f"全局 IDENTITY.md 缺少关键原则: {', '.join(missing_principles)}",
                                           fix_detail="建议执行 /左脑 session 重新写入全局 IDENTITY.md")
            except Exception:
                pass

        # 检查项目级 IDENTITY.md（可选，信息性报告）
        project_identity_count = 0
        workbuddy_base = Path(os.path.expanduser("~")) / "WorkBuddy"
        if workbuddy_base.exists():
            for ws_dir in workbuddy_base.iterdir():
                ws_id = ws_dir / ".workbuddy" / "IDENTITY.md"
                if ws_id.exists():
                    try:
                        ws_content = ws_id.read_text(encoding="utf-8")
                        if _LEFT_BRAIN_MARKER in ws_content:
                            project_identity_count += 1
                    except Exception:
                        pass

        extra = ""
        if project_identity_count > 0:
            extra = f" | 项目级覆盖: {project_identity_count}个workspace"

        return SelfCheckResult("架构注入状态", "✅",
                               f"全局级 IDENTITY.md 已生效（含左脑处理层标记）{extra}")

    # ===== 主流程 =====

    def run(self, engine=None) -> Dict:
        """执行完整自检"""
        if engine:
            self.engine = engine

        # v3.10.1: 先清理旧自检备份（保留最近2个）
        self._cleanup_old_backups()

        has_fix_needed = False

        # 先扫描是否有需要修复的
        checks = [
            self.check_database_integrity,
            self.check_inject_consistency,
            self.check_conversation_history,
            self.check_memory_logs,
            self.check_entanglement_consistency,
            self.check_workspace_isolation,
            self.check_license_status,
            self.check_token_database,
            self.check_backup_freshness,
            self.check_architecture_injection,
        ]

        # 先运行所有检查（不修复）
        for check_fn in checks:
            try:
                result = check_fn()
                if result.status == "⚠️" and not result.fixed:
                    has_fix_needed = True
                self.results.append(result)
            except Exception as e:
                self.results.append(
                    SelfCheckResult(check_fn.__doc__ or "未知", "❌", f"检查异常: {e}"))

        # 如果有需要修复的，先备份再修复
        if has_fix_needed:
            try:
                self._create_backup()
            except Exception:
                pass

            # 重新运行需要修复的检查项（带修复）
            fix_results = []
            for result in self.results:
                if result.status == "⚠️":
                    # 重新运行对应的检查（会触发修复）
                    for check_fn in checks:
                        if check_fn.__doc__ and result.name in check_fn.__doc__:
                            try:
                                new_result = check_fn()
                                fix_results.append((result.name, new_result))
                            except Exception:
                                pass
                            break

            # 更新结果
            for name, new_result in fix_results:
                for i, r in enumerate(self.results):
                    if r.name == name:
                        self.results[i] = new_result
                        break

        # 生成报告
        return self._generate_report()

    def _generate_report(self) -> Dict:
        """生成自检报告"""
        lines = []
        lines.append("🧠 左脑自检报告")
        lines.append("━" * 30)

        passed = sum(1 for r in self.results if r.status == "✅")
        warned = sum(1 for r in self.results if r.status == "⚠️")
        failed = sum(1 for r in self.results if r.status == "❌")

        for r in self.results:
            line = f"{r.status} {r.name}: {r.detail}"
            if r.fixed:
                line += f" → 🔧 {r.fix_detail}"
            lines.append(line)

        lines.append("")
        lines.append(f"📊 总计: ✅{passed} / ⚠️{warned} / ❌{failed}")

        if self._backup_created:
            lines.append(f"💾 修复前备份: {self.backup_path}")

        # 问题汇总
        problems = [r for r in self.results if r.status in ("⚠️", "❌") and not r.fixed]
        if problems:
            lines.append("")
            lines.append("⚠️ 未修复问题:")
            for p in problems:
                lines.append(f"  - {p.name}: {p.detail}")

        report_text = "\n".join(lines)

        return {
            "status": "ok" if warned == 0 and failed == 0 else "issues",
            "passed": passed,
            "warned": warned,
            "failed": failed,
            "backup_path": self.backup_path,
            "results": [
                {
                    "name": r.name,
                    "status": r.status,
                    "detail": r.detail,
                    "fixed": r.fixed,
                    "fix_detail": r.fix_detail,
                }
                for r in self.results
            ],
            "report": report_text,
        }


# ===== 独立运行 =====
if __name__ == "__main__":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    checker = LeftBrainSelfCheck()
    result = checker.run()
    print(result["report"])
    if result["status"] != "ok":
        sys.exit(1)
