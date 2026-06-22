# -*- coding: utf-8 -*-
"""
左脑密钥模块 v3.6 — 三层编码保护版
================================================================
安全策略：
  1. 密钥不以明文出现在源码中，使用三层编码（rolling offset + XOR + base64）
  2. 运行时动态解码，解码后缓存在内存中
  3. RSA私钥（PEM格式）仍为明文存储（PEM格式过长不适合编码，但已不含敏感信息）
  4. 生产分发建议使用 setup.py --embed-keys 编译为 _keys.pyd 进一步提升安全性

编码方式：原始密钥 → XOR(rolling_key) → +offset → base64存储
解码逆序：base64 → -offset → XOR(rolling_key) → 原始密钥
"""

import hashlib
import hmac
import base64

# ====================== 三层编码参数 ======================
_ROLLING_KEY = b"ZUONAO_ROLLING_2024_V3_6_SECURITY_LAYER"
_OFFSET = 137

# ====================== 编码后的密钥数据 ======================
_ENC_SECRET_KEY = "iaSNmvWztsOijKsBlgi79uXRjq/v8L6Qt4mrvJbzqpa4tgOkmsasmMK3uKCx9u8="
_ENC_AES_KEY_SALT = "iaSlmrrAsOsGqI7EnaeP9MyJ1e+nBpKKnIs="
_ENC_CLIENT_API_KEY = "iaSXjqeSkLP/6v75uAe5ys38AcSo0PbikuuRvZqRpseXl6eMmJrF+IkEw66jlfSn"
_ENC_CLIENT_SECRET = "iaSVpqcCmpSo6qGmAa+44gHn35e+B7jpkceNjY29wby/mZS/w76u+PCstIkHpsEE"
_ENC_JWT_SECRET = "iaSOmpKZpu+QvazCi6mJ3PPK8J+45vTptpOzpY+olJ+erq6suo2tkZ2klr6ZmOs="

# RSA公钥（v3.6: 加密方向反转——客户端持有公钥验证签名，不再持有私钥）
RSA_PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtdsxz3J9LF5NkB9EWOz5
2Zoh1bDjwx/2jUDKIU0jGUFHLFQ+VJqEOBW3+e8/WLU3/X/7RG9Rm7ajjwi+HQW0
i3iGT46HHhmwLGK5cqnoTXf4QtgtANxkZpkP1q5JMjC8PvMF9U/l2hyxtpmDXkL4
ZMc2AtqjoIeQlssSwx8IMTlyHvdDFnjoiM13SR8fT+DjJjZpGrt6yNeC9d0iUrFe
s8dkX0/2cGnV+9KSTdI3PB0CC85Ybxw/O+QwJ4jhqKhm7nts1Ob1pCPG/NcpYmTd
bUbeLfXHKUyzNsm8FN8pChmFJgyoDGM8fmYl763J81risi3GDYTEeCLUWCct+jLD
CQIDAQAB
-----END PUBLIC KEY-----"""

# 保留旧字段名兼容性（值为None，不再分发私钥）
RSA_PRIVATE_KEY_PEM = None

# 服务器地址（v3.6: HTTPS强制）
SERVER_URL = "https://121.43.126.137"

# v3.6.1: 服务器自签名CA证书——内建信任锚（替代散落 server_ca.pem 文件）
# 架构定位：IDENTITY.md 内核层常量，编译进 .pyd 后不可篡改/不可删除
SERVER_CA_PEM = """-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgIJAN4MZwSEklpEMA0GCSqGSIb3DQEBCwUAMDcxFzAVBgNV
BAMMDjEyMS40My4xMjYuMTM3MQ8wDQYDVQQKDAZadW9OYW8xCzAJBgNVBAYTAkNO
MB4XDTI2MDYxMjEzMzU1MloXDTI3MDYxMjEzMzU1MlowNzEXMBUGA1UEAwwOMTIx
LjQzLjEyNi4xMzcxDzANBgNVBAoMBlp1b05hbzELMAkGA1UEBhMCQ04wggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCp4M7HjidaX4wD8eZxrq8KkzkjU0ds
qq4Yer6sAD0FhIJUG/gLBjkXC2wkJpsYQMN5yTus13LXWwOMTzJ0UNrLCacxRql/
f+6eZCkdla1bnpAPOVUaazFz38Pab6jRKCH/6aAd3ljAsTDDdifa8fZ9k+qYvRLS
j+XnNJhFADxHMzbqnjrxdLwz0QdxSPPaw8xHzBR3cf2sp3PN5RVGtHNFytm8gxGR
egRHQkmIQoJ7J+YLvoM45Pl5WbXrDHm97W8mMNFP10gjdR/3QQVPBccFJ1WhIXl9
k4pc0AFUZbuvpQarnWlvrrwmTRtxjdTg/nfvC/XrAvqxdoXcJIEAWMg9AgMBAAGj
UDBOMB0GA1UdDgQWBBR/AbknrhSBQldU/J3TwaQhS2VgzDAfBgNVHSMEGDAWgBR/
AbknrhSBQldU/J3TwaQhS2VgzDAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUA
A4IBAQAz7hxe+NhAMELhbdDTn6CsT/beCG/YIr6q0JPbhZVxtx4oDka0rWKbsCU7
H047NjT9Y1N8Owut+47qwnQiaynq0wZ+sFutlOpHrMQwLY24I8rVoVYGnqTaVMla
eMZ6bUk3ToJzoN+3m4F8qkgpvOwzn2Ke1tex2eNBK03GUyc4PKulwoaxrng8zJFJ
q+Jrnd8JzR98PF7OCCOPrfkgmpi9Sf6oDtzqzyQRYbvS+17T/K0x+wLR71b2RN0E
swYM+ag7QWJYr+g9CS4w3n2TFDdLrvELijpUn2WemY2TVn+jGF1lfPUDdF+DBvEx
oAYcjCMF3UmX/yskGsxrgGqLL9D2
-----END CERTIFICATE-----"""


# ====================== 三层解码函数 ======================

def _decode_key(enc_data: str) -> bytes:
    """三层解码密钥数据：base64 → -offset → XOR(rolling_key)"""
    raw = base64.b64decode(enc_data)
    # reverse offset
    shifted = bytes((b - _OFFSET) % 256 for b in raw)
    # XOR with rolling key
    decoded = bytes(b ^ _ROLLING_KEY[i % len(_ROLLING_KEY)] for i, b in enumerate(shifted))
    return decoded


def _decode_str_key(enc_data: str) -> str:
    """解码字符串类型密钥"""
    return _decode_key(enc_data).decode("utf-8")


# ====================== 解码后的密钥 ======================

SECRET_KEY = _decode_key(_ENC_SECRET_KEY)
AES_KEY_SALT = _decode_key(_ENC_AES_KEY_SALT)
CLIENT_API_KEY = _decode_str_key(_ENC_CLIENT_API_KEY)
CLIENT_SECRET = _decode_str_key(_ENC_CLIENT_SECRET)
JWT_SECRET = _decode_str_key(_ENC_JWT_SECRET)


# ====================== 密钥派生函数 ======================

def derive_engine_key(sign_prefix: str) -> bytes:
    """从 license 的 sign_prefix 派生引擎解密密钥（32字节 AES-256）

    算法：SHA256(sign_prefix_utf8 + AES_KEY_SALT)
    """
    return hashlib.sha256(sign_prefix.encode("utf-8") + AES_KEY_SALT).digest()


def generate_universal_sign_prefix() -> str:
    """生成通用签名前缀（用于母包模式默认值）"""
    return hmac.new(SECRET_KEY, b"ZUONAO_UNIVERSAL_SIGN_V3", hashlib.sha256).hexdigest()[:32]


def derive_backup_key() -> bytes:
    """派生备份加密密钥（32字节）"""
    return hashlib.sha256(AES_KEY_SALT + b"_BACKUP_DERIVE_V3").digest()
