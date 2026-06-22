# -*- coding: utf-8 -*-
"""
左脑 .pyd 编译脚本 v3.7（内建型）
================================
使用 Cython 将 .py 源文件编译为 .pyd 二进制扩展模块。

v3.7 内建化改造：
  - 密钥已在 _keys.py 三层编码自洽，直接编译为 .pyd 封死
  - 移除 --embed-keys 外挂注入机制（旧链路: env vars → _keys.pyx → compile）
  - 新链路: _keys.py (自洽) → Cython compile → _keys.pyd
  - 所有密钥/CA证书/LIC加密逻辑 内嵌于编译模块

用法：
    python setup.py build_ext --inplace

编译后的 .pyd 文件可直接替换 .py 源文件。
import 逻辑不变，from crypto_config import SECRET_KEY 仍然正常工作。
"""

import os
import sys
from pathlib import Path

# ====================== 配置 ======================
# 需要编译的源文件列表（不含 engine.py，它加密为 engine_encrypted.dat 分发）
# v3.7 内建化: _keys.py 常驻编译（密钥自洽于源码，不再从 env vars 外挂注入）
COMPILE_TARGETS = [
    "_keys.py",
    "crypto_config.py",
    "启动左脑.py",
    "左脑在线授权.py",
    "token_db.py",
    "ToKen监测助手.py",
]

# 母包根目录
MOTHER_DIR = Path(__file__).resolve().parent

# ====================== v3.7 内建化: 移除 config.env 外挂注入 ======================
# 密钥已在 _keys.py 三层编码自洽，编译为 .pyd 后不可逆提取
# 不再需要从外部 env vars / config.env 注入密钥
# 旧链路: config.env → env vars → _keys.pyx → compile → .pyd （外挂型）
# 新链路: _keys.py (自洽) → compile → .pyd （内建型）

def check_cython():
    """检查 Cython 是否已安装"""
    try:
        import Cython
        print(f"[OK] Cython {Cython.__version__}")
        return True
    except ImportError:
        print("[ERROR] Cython 未安装，请先执行：pip install Cython")
        return False

def check_compiler():
    """检查 C 编译器是否可用"""
    # 如果 MINGW_PATH 环境变量已设置，使用它
    mingw_path = os.environ.get("MINGW_PATH", "")
    if mingw_path:
        mingw_bin = os.path.join(mingw_path, "bin")
        if os.path.exists(os.path.join(mingw_bin, "gcc.exe")):
            os.environ["PATH"] = mingw_bin + os.pathsep + os.environ.get("PATH", "")
            print(f"[OK] MinGW from MINGW_PATH: {mingw_path}")
            return True
    
    # 尝试自动检测 MinGW
    import subprocess
    try:
        result = subprocess.run(["gcc", "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"[OK] gcc found: {result.stdout.split(chr(10))[0]}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # 尝试常见的 MinGW 安装位置
    candidate_dirs = [
        os.path.join(os.path.dirname(MOTHER_DIR), "mingw64"),  # 母包同级目录
        r"C:\mingw64",
        r"C:\msys64\mingw64",
        r"C:\Program Files\mingw-w64",
    ]
    for d in candidate_dirs:
        gcc = os.path.join(d, "bin", "gcc.exe")
        if os.path.exists(gcc):
            os.environ["PATH"] = os.path.join(d, "bin") + os.pathsep + os.environ.get("PATH", "")
            print(f"[OK] gcc found at: {gcc}")
            return True
    
    # 尝试 cl.exe (MSVC)
    try:
        result = subprocess.run(["cl"], capture_output=True, text=True, timeout=5, shell=True)
        if 'Microsoft' in result.stdout or 'Microsoft' in result.stderr:
            print("[OK] MSVC cl.exe found")
            return True
    except:
        pass
    
    print("[ERROR] 未找到 C 编译器 (gcc/cl.exe)")
    print("  请安装 MinGW-w64 或 Visual Studio Build Tools")
    print("  推荐：下载 winlibs MinGW 并解压到 mingw64/ 目录")
    return False

# ====================== 编译器配置 ======================
def configure_mingw_for_msvc_python():
    """配置 MinGW 以兼容 MSVC 编译的 Python
    
    Python 3.13 使用 MSC v.1944 编译，需要生成兼容的 libpython 导入库。
    此函数在编译前检查并生成所需的库文件。
    """
    import sysconfig
    import struct
    
    # Python DLL 在 sys.base_prefix 下（托管的 Python 环境）
    python_home = sysconfig.get_config_var("BINDIR") or os.path.dirname(sys.executable)
    # 尝试多个位置找 python3xx.dll
    python_dll_name = f"python{sys.version_info.major}{sys.version_info.minor}.dll"
    candidate_dll_paths = [
        os.path.join(python_home, python_dll_name),
        os.path.join(sys.base_prefix, python_dll_name),
        os.path.join(sys.prefix, python_dll_name),
        os.path.join(os.path.dirname(sys.executable), python_dll_name),
    ]
    # 同时检查 sysconfig
    dll_path = sysconfig.get_config_var("BINDIR")
    if dll_path:
        candidate_dll_paths.insert(0, os.path.join(dll_path, python_dll_name))
    
    python_dll = None
    for p in candidate_dll_paths:
        if os.path.exists(p):
            python_dll = p
            break
    
    if not python_dll:
        print(f"[WARN] 未找到 {python_dll_name}，跳过 libpython 生成")
        return False
    
    python_dir = os.path.dirname(python_dll)
    libs_dir = os.path.join(os.path.dirname(python_dll), "libs")
    if not os.path.isdir(libs_dir):
        # 尝试创建 libs 目录
        os.makedirs(libs_dir, exist_ok=True)
    
    # 检查是否已有 libpython313.a
    lib_a = os.path.join(libs_dir, f"libpython{sys.version_info.major}{sys.version_info.minor}.a")
    if os.path.exists(lib_a):
        print(f"[OK] libpython 导入库已存在: {lib_a}")
        return True
    
    # 需要 gendef 和 dlltool 工具（MinGW 自带）
    import subprocess
    
    # 1. 生成 .def 文件
    def_path = os.path.join(libs_dir, f"python{sys.version_info.major}{sys.version_info.minor}.def")
    if not os.path.exists(def_path):
        print(f"[INFO] 生成 {def_path} ...")
        try:
            result = subprocess.run(
                ["gendef", python_dll],
                capture_output=True, text=True, timeout=30,
                cwd=libs_dir
            )
            if result.returncode != 0 or not os.path.exists(def_path):
                # gendef 可能输出到当前目录
                alt_def = os.path.join(os.getcwd(), os.path.basename(def_path))
                if os.path.exists(alt_def):
                    import shutil
                    shutil.move(alt_def, def_path)
        except FileNotFoundError:
            print("[WARN] gendef 不可用，尝试使用 gcc 直接链接")
            return False
    
    # 2. 生成 .a 导入库
    if os.path.exists(def_path):
        print(f"[INFO] 生成 {lib_a} ...")
        try:
            machine = "i386:x86-64" if struct.calcsize("P") == 8 else "i386"
            result = subprocess.run(
                ["dlltool", "-d", def_path, "-l", lib_a, "-m", machine],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0 and os.path.exists(lib_a):
                print(f"[OK] libpython 导入库已生成: {lib_a}")
                return True
        except FileNotFoundError:
            print("[WARN] dlltool 不可用")
    
    return False

# ====================== v3.7 内建化: 密钥自洽编译 ======================
# 密钥已在 _keys.py 三层编码自洽，直接编译为 .pyd 封死
# 不再需要 generate_keys_module() 从 env vars 注入
# 旧链路: env vars → _keys.pyx → compile → .pyd （外挂型，已移除）
# 新链路: _keys.py (自洽) → Cython compile → _keys.pyd （内建型）

# ====================== 编译 ======================
def build():
    """执行 Cython 编译（v3.7: 内建型，密钥自洽于 _keys.py）"""
    from Cython.Build import cythonize
    from setuptools import setup, Extension
    
    targets = COMPILE_TARGETS[:]
    
    # 确保目标文件存在
    for target in targets:
        target_path = MOTHER_DIR / target
        if not target_path.exists():
            print(f"[ERROR] 源文件不存在: {target_path}")
            return False
    
    print(f"\n[BUILD] 编译目标 ({len(targets)} 个文件):")
    for t in targets:
        print(f"  - {t}")
    
    # 配置编译器参数
    compiler_directives = {
        "language_level": "3",        # Python 3
        "boundscheck": False,         # 关闭边界检查（性能优化）
        "wraparound": False,          # 关闭负索引回绕
        "embedsignature": True,       # 嵌入函数签名（便于调试）
    }
    
    # C 编译器参数（针对 MSVC 编译的 Python + MinGW）
    import sysconfig
    compile_args = []
    link_args = []
    
    # 如果是 MinGW，需要特殊处理
    if sys.platform == "win32":
        # 添加 Python include 路径
        include_dirs = [sysconfig.get_path("include")]
        
        # 对于 MinGW + MSVC Python，添加兼容性定义
        compile_args.extend([
            "-DMS_WIN64",              # 64位 Windows
            "-D_hypot=hypot",          # MinGW 兼容性修复
        ])
    
    # 创建扩展模块列表
    extensions = []
    for target in targets:
        module_name = target.replace(".py", "").replace(".pyx", "")
        source_file = str(MOTHER_DIR / target)
        extensions.append(
            Extension(
                module_name,
                sources=[source_file],
                include_dirs=include_dirs if 'include_dirs' in dir() else [],
                extra_compile_args=compile_args,
                extra_link_args=link_args,
            )
        )
    
    # 执行编译
    try:
        setup(
            name="左脑核心模块",
            version="3.7",
            description="左脑系统核心编译模块（v3.7 内建型）",
            ext_modules=cythonize(
                extensions,
                compiler_directives=compiler_directives,
                nthreads=os.cpu_count() or 4,
                quiet=False,
            ),
            script_args=["build_ext", "--inplace", "--compiler=mingw32"],
            zip_safe=False,
        )
        print("\n[OK] 编译完成！")
        return True
    except Exception as e:
        print(f"\n[ERROR] 编译失败: {e}")
        import traceback
        traceback.print_exc()
        return False

# ====================== 入口 ======================
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="左脑 .pyd 编译工具 v3.7（内建型）")
    parser.add_argument("--check-only", action="store_true",
                        help="仅检查环境，不执行编译")
    args = parser.parse_args()
    
    print("=" * 60)
    print("左脑 .pyd 编译工具 v3.7（内建型 — 密钥自洽于 _keys.py）")
    print("=" * 60)
    
    if not check_cython():
        sys.exit(1)
    
    if not check_compiler():
        sys.exit(1)
    
    if args.check_only:
        print("\n[OK] 环境检查通过，可以执行编译")
        sys.exit(0)
    
    # 执行编译（密钥已内建，无需 --embed-keys 外挂注入）
    success = build()
    
    if success:
        print("\n" + "=" * 60)
        print("编译成功！密钥内建封死于 .pyd 二进制")
        print("=" * 60)
        print("\n生成的文件在母包目录下，扩展名为 .pyd")
        print("原 .py 文件仍然保留（用于开发调试）")
    else:
        print("\n编译失败，请检查错误信息")
        sys.exit(1)
