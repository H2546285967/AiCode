#!/bin/bash
# ============================================================
# new-project.sh - 自动化项目创建与开发脚本
# 用法: new-project.sh <项目名> [选项]
# ============================================================

set -e

# ---- 配置 ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../.workspace/workspace.env"
BASE_DIR="${WORKSPACE_ROOT}"
PROJECTS_DIR="${BASE_DIR}/AI-【3】-项目开发"
TEMPLATE_DIR="${BASE_DIR}/.automation/templates"
CLAUDE_BIN="$(command -v claude 2>/dev/null || echo 'claude')"
CONVENTIONS_PATH="${BASE_DIR}/AI-ClaudeCode-最佳实践精简.md"

# ---- 颜色 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---- 帮助信息 ----
usage() {
    echo -e "${CYAN}用法:${NC} new-project.sh <项目名> [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --type <类型>      项目类型: springboot, python, nodejs, plain (默认: plain)"
    echo "  -r, --req <文件>       需求文档路径（markdown）"
    echo "  -d, --dev              脚手架完成后自动调用 Claude 开发"
    echo "  --skip-dev             仅生成脚手架，不自动开发（默认）"
    echo "  --skip-git             不初始化 git 仓库"
    echo "  --tools <列表>         逗号分隔的工具列表（默认: all）"
    echo "  -h, --help             显示帮助"
    echo ""
    echo "示例:"
    echo "  new-project.sh my-api -t springboot -r requirements.md -d"
    echo "  new-project.sh ai-chat --type python --req doc.md --dev"
}

# ---- 参数解析 ----
PROJECT_NAME=""
PROJECT_TYPE="plain"
REQ_FILE=""
AUTO_DEV=false
INIT_GIT=true
TOOLS="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)    PROJECT_TYPE="$2"; shift 2 ;;
        -r|--req)     REQ_FILE="$2"; shift 2 ;;
        -d|--dev)     AUTO_DEV=true; shift ;;
        --skip-dev)   AUTO_DEV=false; shift ;;
        --skip-git)   INIT_GIT=false; shift ;;
        --tools)      TOOLS="$2"; shift 2 ;;
        -h|--help)    usage; exit 0 ;;
        -*)           echo -e "${RED}未知选项: $1${NC}"; usage; exit 1 ;;
        *)            PROJECT_NAME="$1"; shift ;;
    esac
done

# ---- 输入验证 ----
if [[ -z "$PROJECT_NAME" ]]; then
    echo -e "${RED}错误: 项目名不能为空${NC}"
    usage
    exit 1
fi

# 检查项目名格式
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo -e "${RED}错误: 项目名只能包含字母、数字、下划线和连字符${NC}"
    exit 1
fi

# 检查目标目录
TARGET_DIR="${PROJECTS_DIR}/${PROJECT_NAME}"
if [[ -d "$TARGET_DIR" ]]; then
    echo -e "${RED}错误: 目录已存在: ${TARGET_DIR}${NC}"
    exit 1
fi

# 检查需求文件
if [[ -n "$REQ_FILE" && ! -f "$REQ_FILE" ]]; then
    echo -e "${RED}错误: 需求文件不存在: ${REQ_FILE}${NC}"
    exit 1
fi

# 检查模板目录
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    echo -e "${RED}错误: 模板目录不存在: ${TEMPLATE_DIR}${NC}"
    exit 1
fi

# ---- 项目描述（根据类型推断）----
declare -A TECH_MAP=(
    [springboot]="Java 21 + Spring Boot 3.x + Maven"
    [springboot-java8]="Java 8 + Spring Boot 2.x + Maven"
    [springboot-ai]="Java 21 + Spring Boot 3.x + Spring AI Alibaba"
    [springboot-langchain]="Java 21 + Spring Boot 3.x + LangChain4j"
    [python]="Python 3.11+ + FastAPI / Flask"
    [nodejs]="Node.js 20+ + Express / NestJS"
    [plain]="纯项目（无特定框架）"
)

TECH_STACK="${TECH_MAP[$PROJECT_TYPE]:-纯项目（无特定框架）}"
PROJECT_DESC="${PROJECT_NAME} 项目（${TECH_STACK}）"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  自动化项目创建${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "  项目名: ${GREEN}${PROJECT_NAME}${NC}"
echo -e "  类型:   ${GREEN}${PROJECT_TYPE}${NC}"
echo -e "  技术栈: ${GREEN}${TECH_STACK}${NC}"
echo -e "  目标:   ${GREEN}${TARGET_DIR}${NC}"
[[ -n "$REQ_FILE" ]] && echo -e "  需求:   ${GREEN}${REQ_FILE}${NC}"
echo -e "  自动开发: ${AUTO_DEV}${NC}"
echo ""

# ---- Step 1: 创建目录 ----
echo -e "${YELLOW}[1/4] 创建项目目录...${NC}"
mkdir -p "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}/.lingma"
mkdir -p "${TARGET_DIR}/.claude"
echo -e "${GREEN}  ✓ 目录创建完成${NC}"

# ---- Step 2: 渲染模板文件 ----
echo -e "${YELLOW}[2/4] 生成工具指令文件...${NC}"

render_template() {
    local src="$1"
    local dst="$2"
    if [[ -f "$src" ]]; then
        sed \
            -e "s/{{PROJECT_NAME}}/${PROJECT_NAME}/g" \
            -e "s/{{PROJECT_TYPE}}/${PROJECT_TYPE}/g" \
            -e "s/{{TECH_STACK}}/${TECH_STACK}/g" \
            -e "s/{{PROJECT_DESC}}/${PROJECT_DESC}/g" \
            -e "s/{{PROJECT_DESCRIPTION}}/${PROJECT_DESC}/g" \
            -e "s|{{WORKSPACE_ROOT}}|${BASE_DIR}|g" \
            -e "s|{{DATE}}|$(date +%Y-%m-%d)|g" \
            -e "s|{{CONVENTIONS_PATH}}|${CONVENTIONS_PATH}|g" \
            "$src" > "$dst"
        echo -e "  ${GREEN}✓${NC} $(basename "$dst")"
    fi
}

# 渲染所有工具指令文件
render_template "${TEMPLATE_DIR}/CLAUDE.md.tmpl"             "${TARGET_DIR}/CLAUDE.md"
render_template "${TEMPLATE_DIR}/AGENTS.md.tmpl"             "${TARGET_DIR}/AGENTS.md"
render_template "${TEMPLATE_DIR}/.cursorrules.tmpl"          "${TARGET_DIR}/.cursorrules"
render_template "${TEMPLATE_DIR}/.qoderrules.tmpl"           "${TARGET_DIR}/.qoderrules"
render_template "${TEMPLATE_DIR}/.minimaxrc.tmpl"            "${TARGET_DIR}/.minimaxrc"
render_template "${TEMPLATE_DIR}/.lingma-instructions.md.tmpl" "${TARGET_DIR}/.lingma/instructions.md"

# 初始化空记忆文件
cat > "${TARGET_DIR}/.claude/memory.md" << 'MEMEOF'
# 项目记忆

## 核心信息
[项目启动后由 AI 助手填充]

## TODO
- [ ] 完成项目基础搭建
MEMEOF
echo -e "  ${GREEN}✓${NC} .claude/memory.md"

echo -e "${GREEN}  ✓ 工具指令文件生成完成（6 个工具）${NC}"

# ---- Step 3: 复制需求文档 ----
if [[ -n "$REQ_FILE" ]]; then
    echo -e "${YELLOW}[3/4] 复制需求文档...${NC}"
    cp "$REQ_FILE" "${TARGET_DIR}/REQUIREMENTS.md"
    echo -e "${GREEN}  ✓ 需求文档已复制到 REQUIREMENTS.md${NC}"
else
    echo -e "${YELLOW}[3/4] 跳过（无需求文档）${NC}"
fi

# ---- Step 4: 初始化 Git ----
if [[ "$INIT_GIT" == "true" ]]; then
    echo -e "${YELLOW}[4/4] 初始化 Git 仓库...${NC}"
    cd "${TARGET_DIR}"
    git init -q
    git add -A
    git commit -q -m "init: ${PROJECT_NAME} 项目脚手架"
    cd "${BASE_DIR}"
    echo -e "${GREEN}  ✓ Git 仓库已初始化${NC}"
else
    echo -e "${YELLOW}[4/4] 跳过 Git 初始化${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ 项目创建完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  路径: ${TARGET_DIR}"
echo ""

# ---- 自动开发 ----
if [[ "$AUTO_DEV" == "true" ]]; then
    if [[ -n "$REQ_FILE" ]]; then
        echo -e "${CYAN}🚀 启动自动开发...${NC}"
        echo ""

        # 渲染开发 prompt
        DEV_PROMPT=$(sed \
            -e "s/{{PROJECT_NAME}}/${PROJECT_NAME}/g" \
            -e "s/{{PROJECT_TYPE}}/${PROJECT_TYPE}/g" \
            -e "s/{{TECH_STACK}}/${TECH_STACK}/g" \
            -e "s|{{DATE}}|$(date +%Y-%m-%d)|g" \
            "${TEMPLATE_DIR}/dev-prompt.md.tmpl")

        # 追加需求文档路径
        DEV_PROMPT="${DEV_PROMPT}

## 需求文档
需求文档位于当前目录的 REQUIREMENTS.md，请读取后按其中的要求开发。

## 输出
所有代码和文件输出到当前目录。"

        cd "${TARGET_DIR}"
        "$CLAUDE_BIN" -p \
            --dangerously-skip-permissions \
            "$DEV_PROMPT"
    else
        echo -e "${YELLOW}⚠️  未提供需求文档，跳过自动开发${NC}"
        echo -e "  手动开发: cd \"${TARGET_DIR}\" && claude"
    fi
else
    echo -e "${CYAN}📋 下一步操作:${NC}"
    echo "  1. cd \"${TARGET_DIR}\""
    echo "  2. 用你习惯的 AI 工具打开（Claude Code / Cursor / 通义灵码等）"
    echo "  3. 工具会自动读取指令文件，遵守 AI-ClaudeCode-最佳实践精简.md 约定"
    if [[ -n "$REQ_FILE" ]]; then
        echo "  4. 告诉 AI 助手：读取 REQUIREMENTS.md 并开始开发"
    fi
fi
