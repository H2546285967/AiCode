#!/bin/bash
# ============================================================
# setup.sh - 工作空间一键适配脚本
# 搬到新机器后运行一次即可：bash .workspace/setup.sh
# ============================================================

set -e

# ---- 检测工作空间根目录 ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/workspace.env"

# ---- 颜色 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  个人工作空间 - 一键适配${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ---- Step 1: 写入 workspace.env + 生成 MCP 配置 ----
echo -e "${YELLOW}[1/5] 写入工作空间路径...${NC}"
cat > "${ENV_FILE}" << EOF
# workspace.env - 由 setup.sh 自动生成于 $(date +%Y-%m-%d)
# 工作空间根目录（所有脚本通过 source 此文件获取路径）
WORKSPACE_ROOT="${WORKSPACE_ROOT}"
EOF
echo -e "  ${GREEN}✓${NC} WORKSPACE_ROOT = ${WORKSPACE_ROOT}"

# 将 Git Bash 风格的 /h/... 转换为 Windows 风格的 H:/...，供 MCP server 使用
MCP_ROOT="${WORKSPACE_ROOT}"
if [[ "${MCP_ROOT}" =~ ^/([a-zA-Z])/(.*) ]]; then
    MCP_ROOT="${BASH_REMATCH[1]^^}:/${BASH_REMATCH[2]}"
fi

MCP_TEMPLATE="${WORKSPACE_ROOT}/.claude/mcp.json.template"
MCP_OUTPUT="${WORKSPACE_ROOT}/.claude/mcp.json"
if [[ -f "${MCP_TEMPLATE}" ]]; then
    sed "s#{{WORKSPACE_ROOT}}#${MCP_ROOT}#g" "${MCP_TEMPLATE}" > "${MCP_OUTPUT}"
    echo -e "  ${GREEN}✓${NC} 已生成 .claude/mcp.json（MCP_ROOT = ${MCP_ROOT}）"
else
    echo -e "  ${YELLOW}⚠${NC} 未找到 .claude/mcp.json.template，跳过 MCP 配置生成"
fi

# ---- Step 2: 检查目录结构 ----
echo -e "${YELLOW}[2/5] 检查目录结构...${NC}"

REQUIRED_DIRS=(
    ".automation"
    ".automation/templates"
    ".ai-memory"
    ".claude"
    "AI-【3】-项目开发"
    "AI-【4】-公司项目"
    "AI-【2】-学习"
    "archives"
    "data"
    "benchmarks"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ -d "${WORKSPACE_ROOT}/${dir}" ]]; then
        echo -e "  ${GREEN}✓${NC} ${dir}/"
    else
        echo -e "  ${YELLOW}⚠${NC} ${dir}/ 不存在，创建中..."
        mkdir -p "${WORKSPACE_ROOT}/${dir}"
        echo -e "  ${GREEN}✓${NC} ${dir}/ 已创建"
    fi
done

echo ""

# ---- Step 3: 安装 Node 依赖 ----
echo -e "${YELLOW}[3/5] 安装 Node 依赖...${NC}"
if [[ -f "${WORKSPACE_ROOT}/package.json" ]]; then
    cd "${WORKSPACE_ROOT}"
    npm install
    echo -e "  ${GREEN}✓${NC} npm 依赖已安装"
else
    echo -e "  ${YELLOW}⚠${NC} 未找到 package.json"
fi

echo ""

# ---- Step 4: 检查工具安装 ----
echo -e "${YELLOW}[4/5] 检查 AI 工具安装情况...${NC}"

check_tool() {
    local name="$1"
    local cmd="$2"
    if command -v "$cmd" &>/dev/null; then
        local version=$("$cmd" --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "  ${GREEN}✓${NC} ${name} — ${version}"
        return 0
    else
        echo -e "  ${RED}✗${NC} ${name} — 未安装"
        return 1
    fi
}

TOOLS_OK=0
TOOLS_TOTAL=0

check_tool "Claude Code" "claude" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

check_tool "Node.js" "node" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

check_tool "Git" "git" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

check_tool "Java" "java" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

check_tool "Maven" "mvn" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

check_tool "Python" "python" && TOOLS_OK=$((TOOLS_OK+1)) || check_tool "Python" "python3" && TOOLS_OK=$((TOOLS_OK+1))
TOOLS_TOTAL=$((TOOLS_TOTAL+1))

echo ""

# ---- Step 5: 生成适配报告 + 可选跑测试 ----
echo -e "${YELLOW}[5/5] 适配报告${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "  工作空间: ${GREEN}${WORKSPACE_ROOT}${NC}"
echo -e "  工具就绪: ${GREEN}${TOOLS_OK}/${TOOLS_TOTAL}${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [[ $TOOLS_OK -lt 3 ]]; then
    echo -e "${RED}⚠️  关键工具缺失，建议安装后重新运行 setup.sh${NC}"
    echo "  必需: Claude Code, Git, Node.js"
    echo "  可选: Java + Maven（Java 项目）, Python（Python 项目）"
else
    echo -e "${GREEN}✅ 工作空间已就绪！${NC}"
    echo ""
    echo "验证测试："
    echo "  npm test                                    # 跑全部测试"
    echo "  npm run benchmark                           # 跑性能 benchmark"
    echo ""
    echo "快速开始："
    echo "  1. 新建项目:  cd \"${WORKSPACE_ROOT}/AI-【3】-项目开发\" && bash ../.automation/new-project.sh <项目名> -t <类型>"
    echo "  2. 公司项目:  cd \"${WORKSPACE_ROOT}/AI-【4】-公司项目\" && git clone <仓库地址>"
    echo "  3. Claude Code: cd \"${WORKSPACE_ROOT}\" && claude"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "  建议下一步: 运行 npm test 验证环境"
echo -e "${CYAN}========================================${NC}"
