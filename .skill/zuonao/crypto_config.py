# -*- coding: utf-8 -*-
"""
左脑统一密钥管理模块 v3.5 — 安全重构版
=====================================
所有密钥统一从 _keys 编译模块加载。
v3.5 安全加固：移除所有明文回退值，密钥仅在 _keys 中以三层编码存储。

安全说明：
  - 密钥不再以明文硬编码存在于本文件
  - _keys 模块使用三层编码保护密钥（rolling offset + XOR + struct reversal）
  - 若 _keys 不可导入，系统拒绝启动（不降级到明文模式）
  - 生产环境建议使用 _keys.pyd（Cython 编译版）进一步提升安全性
"""

import os
import sys

# ====================== v3.5: 强制从 _keys 模块加载 ======================
# 所有密钥统一从 _keys 模块读取，不再有任何明文回退
try:
    from _keys import (
        SECRET_KEY, AES_KEY_SALT, RSA_PUBLIC_KEY_PEM, RSA_PRIVATE_KEY_PEM,
        CLIENT_API_KEY, CLIENT_SECRET,
        SERVER_URL, JWT_SECRET, SERVER_CA_PEM,
        derive_engine_key, generate_universal_sign_prefix, derive_backup_key,
    )
    ADMIN_PASSWORD = ""  # 管理员密码由环境变量注入，不存储在 _keys 中
except ImportError:
    print("🧠 安全错误：密钥保护模块(_keys)缺失，系统拒绝启动")
    print("   请确认安装包完整，或联系卖家获取正版安装包")
    sys.exit(1)
