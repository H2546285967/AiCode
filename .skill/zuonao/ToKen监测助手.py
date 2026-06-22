# -*- coding: utf-8 -*-
"""
ToKen监测助手 V3 — 实时跨平台Token消耗统计 + 精准费用计算
=========================================================
V3 新增功能：
  1. 实时Token消耗总量显示（今日/累计）
  2. 精准Token节省量 + 节省费用（按模型定价计算）
  3. 平台消耗分布图
  4. 费用明细（消耗费用 vs 节省费用对比）
  5. 消耗/节省趋势图
"""
import json
import sys
import os
import time
import csv
import io
import struct
import socket
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path
from datetime import datetime

# ===== 数据库层 =====
SKILL_DIR = Path(__file__).resolve().parent

# 兼容两种目录结构
if (SKILL_DIR / "data").exists():
    _DATA_ROOT = SKILL_DIR
elif (SKILL_DIR.parent / "data").exists():
    _DATA_ROOT = SKILL_DIR.parent
else:
    _DATA_ROOT = SKILL_DIR

# 优先使用SQLite数据层
try:
    from token_db import (
        init_db, counter_get_all, today_get_all, scene_get_all,
        save_daily_snapshot, get_daily_snapshots,
        get_hourly_data, get_hourly_range,
        save_window_pos, load_window_pos,
        check_achievements, get_achievements,
        export_csv, export_csv_to_file, ensure_db,
        MonitorBridge, PreciseTokenizer, SimpleTokenizer,
        get_dashboard_data, get_realtime_usage, get_platform_summary,
        record_platform_usage, TokenPricer,
        DB_PATH, DATA_DIR,
    )
    _DB_OK = True
except ImportError:
    _DB_OK = False

# 回退：JSON读取
DATA_FILE = _DATA_ROOT / "data" / "memory_duck_data.json"


def load_engine_stats():
    """从数据源读取监测计数器（优先SQLite，回退JSON）"""
    if _DB_OK:
        try:
            return get_dashboard_data()
        except Exception:
            pass
    # 回退JSON
    if not DATA_FILE.exists():
        return None
    try:
        with open(str(DATA_FILE), "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception:
        return None


def fmt_number(n):
    if n >= 1_000_000:
        return f"{n/1_000_000:.2f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}K"
    return str(n)


def fmt_money(yuan):
    """格式化费用显示"""
    if yuan >= 100:
        return f"¥{yuan:.2f}"
    if yuan >= 1:
        return f"¥{yuan:.3f}"
    if yuan >= 0.01:
        return f"¥{yuan:.4f}"
    if yuan > 0:
        return f"¥{yuan:.6f}"
    return "¥0"


def fmt_time(hours):
    if hours >= 24:
        return f"{hours/24:.1f}天"
    if hours >= 1:
        return f"{hours:.1f}小时"
    if hours * 60 >= 1:
        return f"{hours*60:.0f}分钟"
    return f"{hours*3600:.0f}秒"


# ====================== Tkinter 浮动窗口 ======================

try:
    import tkinter as tk
except ImportError:
    print("❌ 需要 Tkinter（Python 自带）")
    sys.exit(1)


class TokenMonitorV3(tk.Tk):
    """ToKen 监测助手 V3 — 实时消耗统计 + 精准费用"""

    # ===== 配色方案 =====
    BG = "#0a0f1a"
    CARD = "#111a2e"
    CARD2 = "#0d1423"
    ACCENT = "#00aaff"
    GREEN = "#00dc82"
    RED = "#ff4757"
    YELLOW = "#ffcc33"
    ORANGE = "#ff9f43"
    TEXT1 = "#e0e6ed"
    TEXT2 = "#8892a4"
    BORDER = "#1e2a45"

    # ===== 窗口尺寸 =====
    MINI_H = 36
    FULL_W = 360
    FULL_H = 520

    # ===== 页面模式 =====
    PAGE_DASHBOARD = "dashboard"
    PAGE_TREND = "trend"
    PAGE_HEATMAP = "heatmap"
    PAGE_ACHIEVE = "achieve"

    def __init__(self):
        super().__init__()
        self.title("ToKen 监测助手 V3")
        self.overrideredirect(True)
        self.attributes("-topmost", True)
        self.attributes("-alpha", 0.92)
        self.configure(bg=self.BG)

        # 状态
        self._running = True  # v3.3: 防止窗口销毁后定时器继续触发
        self._minimized = False
        self._idle_timer = None
        self._hover_timer = None
        self._tip_index = 0
        self._last_tips = []
        self._mode = "today"  # today / total
        self._current_page = self.PAGE_DASHBOARD
        self._drag_data = {"x": 0, "y": 0}
        self._last_data = None
        self._achievement_popup = None
        self._hotkey_registered = True  # v3.4

        # Socket 通信桥
        self._bridge = None
        if _DB_OK:
            try:
                self._bridge = MonitorBridge()
                self._bridge.start_server(handler=self._on_engine_message)
            except Exception:
                pass

        # 窗口尺寸和位置
        self.geometry(f"{self.FULL_W}x{self.FULL_H}")
        self._set_position()

        # 构建 UI
        self._build_ui()

        # 鼠标悬停展开
        self.bind("<Enter>", self._on_enter_body)
        self.bind("<Leave>", self._on_leave_body)
        self._title_bar.bind("<Enter>", self._on_enter_body)
        self._title_bar.bind("<Leave>", self._on_leave_body)

        # 快捷键注册
        self._register_hotkey()

        # 定时刷新
        self._refresh()
        self._reset_idle_timer()

        # 定时快照
        self._snapshot_timer()

    def _set_position(self):
        """设置窗口位置"""
        if _DB_OK:
            pos = load_window_pos()
            if pos.get("win_x") is not None and pos.get("win_y") is not None:
                self.geometry(f"+{pos['win_x']}+{pos['win_y']}")
                return
        sw = self.winfo_screenwidth()
        self.geometry(f"+{sw - self.FULL_W - 20}+{80}")

    def _save_position(self):
        """保存窗口位置"""
        if _DB_OK:
            try:
                save_window_pos(self.winfo_x(), self.winfo_y(),
                              self.FULL_W, self.FULL_H)
            except Exception:
                pass

    def _register_hotkey(self):
        """注册全局快捷键 Ctrl+Alt+T"""
        try:
            import ctypes
            self._hotkey_id = 0x0001
            user32 = ctypes.windll.user32
            if user32.RegisterHotKey(None, self._hotkey_id, 0x0001 | 0x0002, 0x54):
                self._hotkey_thread = threading.Thread(target=self._hotkey_listener, daemon=True)
                self._hotkey_thread.start()
        except Exception:
            pass

    def _hotkey_listener(self):
        try:
            import ctypes
            msg = ctypes.wintypes.MSG()
            user32 = ctypes.windll.user32
            while user32.GetMessageW(ctypes.byref(msg), None, 0, 0):
                if msg.message == 0x0312:
                    self.after(0, self._toggle_visibility)
                user32.TranslateMessage(ctypes.byref(msg))
                user32.DispatchMessageW(ctypes.byref(msg))
        except Exception:
            pass

    def _toggle_visibility(self):
        if self.state() == 'iconic':
            self.deiconify()
        elif self.attributes('-alpha') > 0:
            if self._minimized:
                self._expand()
            else:
                self._minimize()

    def _build_ui(self):
        # ===== 标题栏 =====
        self._title_bar = tk.Frame(self, bg=self.CARD2, height=32)
        self._title_bar.pack(fill="x")
        self._title_bar.pack_propagate(False)

        self._title_icon = tk.Label(self._title_bar, text="📊",
                                     font=("微软雅黑", 11),
                                     bg=self.CARD2, fg=self.ACCENT)
        self._title_icon.pack(side="left", padx=(8, 2))
        self._title_text = tk.Label(self._title_bar, text="ToKen V3 实时统计",
                                     font=("微软雅黑", 10, "bold"),
                                     bg=self.CARD2, fg=self.ACCENT)
        self._title_text.pack(side="left")

        # 按钮区
        btn_frame = tk.Frame(self._title_bar, bg=self.CARD2)
        btn_frame.pack(side="right", padx=4)

        export_btn = tk.Label(btn_frame, text="📥",
                              font=("微软雅黑", 10),
                              bg=self.CARD2, fg=self.YELLOW, cursor="hand2")
        export_btn.pack(side="left", padx=2)
        export_btn.bind("<Button-1>", lambda e: self._export_csv())
        export_btn.bind("<Enter>", lambda e: export_btn.configure(fg=self.GREEN))
        export_btn.bind("<Leave>", lambda e: export_btn.configure(fg=self.YELLOW))

        achieve_btn = tk.Label(btn_frame, text="🏆",
                                font=("微软雅黑", 10),
                                bg=self.CARD2, fg=self.YELLOW, cursor="hand2")
        achieve_btn.pack(side="left", padx=2)
        achieve_btn.bind("<Button-1>", lambda e: self._switch_page(self.PAGE_ACHIEVE))
        achieve_btn.bind("<Enter>", lambda e: achieve_btn.configure(fg=self.GREEN))
        achieve_btn.bind("<Leave>", lambda e: achieve_btn.configure(fg=self.YELLOW))

        self._mini_btn = tk.Label(btn_frame, text="─",
                                   font=("微软雅黑", 10),
                                   bg=self.CARD2, fg=self.TEXT2, cursor="hand2")
        self._mini_btn.pack(side="left", padx=2)
        self._mini_btn.bind("<Button-1>", lambda e: self._toggle_minimize())

        # 今日/总计切换
        self._mode_btn = tk.Label(btn_frame, text="今日",
                                   font=("微软雅黑", 9),
                                   bg=self.CARD, fg=self.GREEN, cursor="hand2",
                                   padx=5, pady=1)
        self._mode_btn.pack(side="left", padx=2)
        self._mode_btn.bind("<Button-1>", lambda e: self._toggle_mode())

        close_btn = tk.Label(btn_frame, text="✕",
                              font=("微软雅黑", 11),
                              bg=self.CARD2, fg=self.TEXT2, cursor="hand2")
        close_btn.pack(side="left", padx=3)
        close_btn.bind("<Button-1>", lambda e: self._on_close())
        close_btn.bind("<Enter>", lambda e: close_btn.configure(fg=self.RED))
        close_btn.bind("<Leave>", lambda e: close_btn.configure(fg=self.TEXT2))

        # 标题栏拖拽
        btn_frame.bind("<Button-1>", lambda e: "break")
        for w in (self._title_bar, self._title_icon, self._title_text):
            w.bind("<Button-1>", self._drag_start)
            w.bind("<B1-Motion>", self._drag_move)
            w.bind("<ButtonRelease-1>", self._drag_end)
            w.bind("<Double-Button-1>", self._toggle_topmost)

        # ===== 页面切换标签栏 =====
        tab_bar = tk.Frame(self, bg=self.BORDER, height=24)
        tab_bar.pack(fill="x")
        tab_bar.pack_propagate(False)

        self._tab_buttons = {}
        tabs = [
            (self.PAGE_DASHBOARD, "📊 实时"),
            (self.PAGE_TREND, "📈 趋势"),
            (self.PAGE_HEATMAP, "🔥 热力图"),
        ]
        for key, label in tabs:
            btn = tk.Label(tab_bar, text=label,
                          font=("微软雅黑", 9),
                          bg=self.CARD if key == self._current_page else self.BORDER,
                          fg=self.ACCENT if key == self._current_page else self.TEXT2,
                          cursor="hand2", padx=10, pady=3)
            btn.pack(side="left", padx=1)
            btn.bind("<Button-1>", lambda e, k=key: self._switch_page(k))
            # v3.4: hover 效果
            btn.bind("<Enter>", lambda e, b=btn: b.configure(bg=self.CARD if b.cget("bg") == self.BORDER else self.CARD2, fg=self.ACCENT))
            btn.bind("<Leave>", lambda e, b=btn: b.configure(bg=self.CARD if self._current_page == [k for k in self._tab_buttons if self._tab_buttons[k] == b][0] else self.BORDER, fg=self.ACCENT if self._current_page == [k for k in self._tab_buttons if self._tab_buttons[k] == b][0] else self.TEXT2))
            self._tab_buttons[key] = btn

        # ===== 主体内容区 =====
        self._body = tk.Frame(self, bg=self.BG)
        self._body.pack(fill="both", expand=True, padx=8, pady=(3, 6))

        # 创建页面容器
        self._pages = {}
        self._build_dashboard_page()
        self._build_trend_page()
        self._build_heatmap_page()
        self._build_achieve_page()

        # 显示默认页面
        self._show_page(self._current_page)

        # body 内容区 hover
        self._body.bind("<Enter>", lambda e: self._cancel_idle_timer())
        self._body.bind("<Leave>", lambda e: self._reset_idle_timer())

    # ====================== 仪表盘页面 V3 ======================

    def _build_dashboard_page(self):
        page = tk.Frame(self._body, bg=self.BG)
        self._pages[self.PAGE_DASHBOARD] = page

        # ===== 核心指标区：消耗 + 节省 =====
        core = tk.Frame(page, bg=self.CARD, padx=6, pady=4)
        core.pack(anchor="w", fill="x")

        # 模式指示器（v3.4）
        self._mode_indicator = tk.Label(core, text="",
                                         font=("微软雅黑", 7),
                                         bg=self.CARD, fg=self.YELLOW)
        self._mode_indicator.pack(anchor="w")

        # 第一行：Token消耗总量
        row_consumed = tk.Frame(core, bg=self.CARD)
        row_consumed.pack(anchor="w", fill="x")
        tk.Label(row_consumed, text="消耗",
                 font=("微软雅黑", 8, "bold"),
                 bg=self.CARD, fg=self.ORANGE).pack(side="left")
        self._consumed_label = tk.Label(row_consumed, text="0",
                                          font=("Consolas", 22, "bold"),
                                          bg=self.CARD, fg=self.ORANGE)
        self._consumed_label.pack(side="left", padx=(4, 0))
        self._consumed_unit = tk.Label(row_consumed, text="tokens",
                                        font=("微软雅黑", 10),
                                        bg=self.CARD, fg=self.TEXT2)
        self._consumed_unit.pack(side="left", padx=(2, 0))
        self._consumed_cost_label = tk.Label(row_consumed, text="¥0",
                                               font=("Consolas", 11, "bold"),
                                               bg=self.CARD, fg=self.RED)
        self._consumed_cost_label.pack(side="right")

        # 第二行：Token节省量
        row_saved = tk.Frame(core, bg=self.CARD)
        row_saved.pack(anchor="w", fill="x", pady=(2, 0))
        tk.Label(row_saved, text="节省",
                 font=("微软雅黑", 8, "bold"),
                 bg=self.CARD, fg=self.GREEN).pack(side="left")
        self._saved_label = tk.Label(row_saved, text="0",
                                      font=("Consolas", 18, "bold"),
                                      bg=self.CARD, fg=self.GREEN)
        self._saved_label.pack(side="left", padx=(4, 0))
        self._saved_unit = tk.Label(row_saved, text="tokens",
                                     font=("微软雅黑", 10),
                                     bg=self.CARD, fg=self.TEXT2)
        self._saved_unit.pack(side="left", padx=(2, 0))
        self._saved_cost_label = tk.Label(row_saved, text="省 ¥0",
                                           font=("Consolas", 11, "bold"),
                                           bg=self.CARD, fg=self.GREEN)
        self._saved_cost_label.pack(side="right")

        # 第三行：节省率进度条
        row_rate = tk.Frame(core, bg=self.CARD)
        row_rate.pack(anchor="w", fill="x", pady=(2, 0))
        tk.Label(row_rate, text="节省率",
                 font=("微软雅黑", 7),
                 bg=self.CARD, fg=self.TEXT2).pack(side="left")
        self._rate_canvas = tk.Canvas(row_rate, bg=self.CARD2, highlightthickness=0,
                                       width=160, height=10)
        self._rate_canvas.pack(side="left", padx=4)
        self._rate_label = tk.Label(row_rate, text="0%",
                                     font=("Consolas", 9, "bold"),
                                     bg=self.CARD, fg=self.GREEN)
        self._rate_label.pack(side="right")

        # ===== 平台消耗分布 =====
        row_plat = tk.Frame(page, bg=self.BG)
        row_plat.pack(anchor="w", fill="x")
        tk.Label(row_plat, text="📊 平台",
                 font=("微软雅黑", 8, "bold"),
                 bg=self.BG, fg=self.ACCENT).pack(side="left")
        self._platform_label = tk.Label(row_plat, text="",
                                         font=("微软雅黑", 8),
                                         bg=self.BG, fg=self.TEXT1)
        self._platform_label.pack(side="left", padx=(4, 0))

        # 平台Canvas
        self._platform_canvas = tk.Canvas(page, bg=self.CARD2, highlightthickness=0,
                                           width=340, height=50)
        self._platform_canvas.pack(fill="x", pady=(2, 0))

        # ===== 时间 + 操作统计 =====
        row_time = tk.Frame(page, bg=self.BG)
        row_time.pack(anchor="w", fill="x")
        self._time_label = tk.Label(row_time, text="⏱ 0",
                                     font=("微软雅黑", 9),
                                     bg=self.BG, fg=self.TEXT1)
        self._time_label.pack(side="left")
        self._speed_label = tk.Label(row_time, text="⚡0t/s",
                                      font=("微软雅黑", 9),
                                      bg=self.BG, fg=self.ACCENT)
        self._speed_label.pack(side="right")

        row_daily = tk.Frame(page, bg=self.BG)
        row_daily.pack(anchor="w", fill="x")
        self._daily_label = tk.Label(row_daily, text="日均 0",
                                      font=("微软雅黑", 9),
                                      bg=self.BG, fg=self.TEXT1)
        self._daily_label.pack(side="left")
        self._co2_label = tk.Label(row_daily, text="🌱0g",
                                    font=("微软雅黑", 9),
                                    bg=self.BG, fg=self.TEXT2)
        self._co2_label.pack(side="right")

        # ===== 费用对比卡片 =====
        cost_frame = tk.Frame(page, bg=self.CARD, padx=6, pady=3)
        cost_frame.pack(anchor="w", fill="x")

        self._cost_detail_label = tk.Label(cost_frame, text="",
                                            font=("微软雅黑", 8),
                                            bg=self.CARD, fg=self.TEXT1,
                                            wraplength=270, justify="left")
        self._cost_detail_label.pack(anchor="w")

        # ===== 底部：操作数 + 习惯 + 刷新 =====
        tk.Frame(page, height=1, bg=self.BORDER).pack(fill="x", pady=3)

        row_ops = tk.Frame(page, bg=self.BG)
        row_ops.pack(anchor="w", fill="x")
        self._ops_label = tk.Label(row_ops, text="操作 0次",
                                    font=("微软雅黑", 8),
                                    bg=self.BG, fg=self.TEXT2)
        self._ops_label.pack(side="left")
        self._time_str = tk.Label(row_ops, text="",
                                   font=("微软雅黑", 8),
                                   bg=self.BG, fg=self.TEXT2)
        self._time_str.pack(side="right")
        export_btn_bottom = tk.Label(row_ops, text="📥CSV",
                                font=("微软雅黑", 8),
                                bg=self.BG, fg=self.YELLOW, cursor="hand2")
        export_btn_bottom.pack(side="right", padx=(0, 4))
        export_btn_bottom.bind("<Button-1>", lambda e: self._export_csv())

        refresh_btn = tk.Label(row_ops, text="🔄",
                                font=("微软雅黑", 8),
                                bg=self.BG, fg=self.ACCENT, cursor="hand2")
        refresh_btn.pack(side="right", padx=(0, 2))
        refresh_btn.bind("<Button-1>", lambda e: self._refresh_manual())

        self._habit_label = tk.Label(page, text="🧠 分析中...",
                                      font=("微软雅黑", 8),
                                      bg=self.BG, fg=self.ACCENT)
        self._habit_label.pack(anchor="w")

        self._tip_label = tk.Label(page, text="",
                                    font=("微软雅黑", 8),
                                    bg=self.BG, fg=self.YELLOW, wraplength=280)
        self._tip_label.pack(anchor="w")

    # ====================== 趋势页面 ======================

    def _build_trend_page(self):
        page = tk.Frame(self._body, bg=self.BG)
        self._pages[self.PAGE_TREND] = page

        tk.Label(page, text="📈 Token消耗/节省趋势（近7天）",
                 font=("微软雅黑", 9, "bold"),
                 bg=self.BG, fg=self.ACCENT).pack(anchor="w", pady=(0, 4))

        self._trend_canvas = tk.Canvas(page, bg=self.CARD,
                                        highlightthickness=0,
                                        width=280, height=200)
        self._trend_canvas.pack(fill="x")

        self._trend_info = tk.Label(page, text="等待数据...",
                                     font=("微软雅黑", 8),
                                     bg=self.BG, fg=self.TEXT2)
        self._trend_info.pack(anchor="w", pady=(4, 0))

        tk.Label(page, text="📊 操作趋势（近7天）",
                 font=("微软雅黑", 9, "bold"),
                 bg=self.BG, fg=self.ACCENT).pack(anchor="w", pady=(8, 4))

        self._ops_canvas = tk.Canvas(page, bg=self.CARD,
                                      highlightthickness=0,
                                      width=280, height=120)
        self._ops_canvas.pack(fill="x")

    # ====================== 热力图页面 ======================

    def _build_heatmap_page(self):
        page = tk.Frame(self._body, bg=self.BG)
        self._pages[self.PAGE_HEATMAP] = page

        tk.Label(page, text="🔥 今日时段热力图",
                 font=("微软雅黑", 9, "bold"),
                 bg=self.BG, fg=self.ACCENT).pack(anchor="w", pady=(0, 4))

        self._heatmap_canvas = tk.Canvas(page, bg=self.CARD,
                                          highlightthickness=0,
                                          width=280, height=220)
        self._heatmap_canvas.pack(fill="x")

        self._heatmap_info = tk.Label(page, text="",
                                       font=("微软雅黑", 8),
                                       bg=self.BG, fg=self.TEXT2)
        self._heatmap_info.pack(anchor="w", pady=(4, 0))

    # ====================== 成就页面 ======================

    def _build_achieve_page(self):
        page = tk.Frame(self._body, bg=self.BG)
        self._pages[self.PAGE_ACHIEVE] = page

        tk.Label(page, text="🏆 成就系统",
                 font=("微软雅黑", 9, "bold"),
                 bg=self.BG, fg=self.YELLOW).pack(anchor="w", pady=(0, 4))

        self._achieve_text = tk.Text(page, bg=self.CARD, fg=self.TEXT1,
                                      font=("微软雅黑", 8),
                                      wrap="word", height=18, width=35,
                                      highlightthickness=0, bd=0,
                                      padx=4, pady=4)
        self._achieve_text.pack(fill="both", expand=True)
        self._achieve_text.configure(state="disabled")

    # ====================== 页面切换 ======================

    def _switch_page(self, page_key):
        self._current_page = page_key
        for k, btn in self._tab_buttons.items():
            btn.configure(
                bg=self.CARD if k == page_key else self.BORDER,
                fg=self.ACCENT if k == page_key else self.TEXT2
            )
        self._show_page(page_key)

        if page_key == self.PAGE_TREND:
            self._draw_trend_chart()
        elif page_key == self.PAGE_HEATMAP:
            self._draw_heatmap()

    def _show_page(self, page_key):
        for p in self._pages.values():
            p.pack_forget()
        if page_key in self._pages:
            self._pages[page_key].pack(fill="both", expand=True)

    # ====================== 缩小/展开 ======================

    def _toggle_minimize(self):
        if self._minimized:
            self._expand()
        else:
            self._minimize()

    def _minimize(self):
        self._minimized = True
        for p in self._pages.values():
            p.pack_forget()
        self._body.pack_forget()
        self.geometry(f"{self.FULL_W}x{self.MINI_H}")
        self._title_text.configure(text="  ▸ 展开")
        self._mini_btn.configure(text="□")
        self._reset_idle_timer()

    def _expand(self):
        self._minimized = False
        self._body.pack(fill="both", expand=True, padx=8, pady=(3, 6))
        self._show_page(self._current_page)
        self.geometry(f"{self.FULL_W}x{self.FULL_H}")
        self._title_text.configure(text="ToKen V3 实时统计" if self._hotkey_registered else "ToKen V3 ⚠热键不可用")
        self._mini_btn.configure(text="─")
        self._cancel_idle_timer()
        self._reset_idle_timer()

    def _reset_idle_timer(self):
        self._cancel_idle_timer()
        if not self._minimized:
            self._idle_timer = self.after(15000, self._minimize)

    def _cancel_idle_timer(self):
        if self._idle_timer:
            self.after_cancel(self._idle_timer)
            self._idle_timer = None

    # ====================== 鼠标悬停 ======================

    def _on_enter_body(self, event=None):
        if self._minimized:
            if self._hover_timer:
                self.after_cancel(self._hover_timer)
            self._hover_timer = self.after(200, self._expand)

    def _on_leave_body(self, event=None):
        if self._hover_timer:
            self.after_cancel(self._hover_timer)
            self._hover_timer = None

    # ====================== 拖拽 ======================

    def _drag_start(self, event):
        self._drag_data["x"] = event.x
        self._drag_data["y"] = event.y

    def _drag_move(self, event):
        x = self.winfo_x() + event.x - self._drag_data["x"]
        y = self.winfo_y() + event.y - self._drag_data["y"]
        self.geometry(f"+{x}+{y}")

    def _drag_end(self, event):
        self._save_position()

    # ====================== 数据刷新 V3 ======================

    def _refresh_manual(self):
        self._refresh(force=True)
        self._time_str.configure(text=f"{datetime.now().strftime('%H:%M')} 🔄")

    def _refresh(self, force=False):
        try:
            data = load_engine_stats()
            if data:
                self._last_data = data
                self._update_dashboard(data)

                # 成就检查
                if _DB_OK and data:
                    try:
                        newly = check_achievements(
                            learn_count=data.get("learn_count", 0),
                            query_count=data.get("query_count", 0),
                            search_count=data.get("search_count", 0),
                            token_savings=data.get("token_savings", 0),
                            total_ops=data.get("total_ops", 0),
                            nodes_count=data.get("nodes", 0) if isinstance(data.get("nodes"), int) else len(data.get("nodes", [])),
                            edges_count=data.get("edges", 0) if isinstance(data.get("edges"), int) else 0,
                            money_saved=data.get("money_saved", 0),
                            co2_saved=data.get("co2_saved", 0),
                            days_active=data.get("days_active", 1),
                            active_funcs=data.get("active_funcs", 0),
                        )
                        if newly:
                            self._show_achievement_popup(newly)
                    except Exception:
                        pass

                if self._current_page == self.PAGE_TREND:
                    self._draw_trend_chart(mode=self._mode)
                elif self._current_page == self.PAGE_HEATMAP:
                    self._draw_heatmap(mode=self._mode)
                elif self._current_page == self.PAGE_ACHIEVE:
                    self._update_achievements(mode=self._mode)
            else:
                # v3.4: 无数据时显示 "--" 而非 "0"，与零活动区分
                self._consumed_label.configure(text="--")
                self._saved_label.configure(text="--")
                self._saved_cost_label.configure(text="省 --")
                self._consumed_cost_label.configure(text="--")
                self._habit_label.configure(text="🧠 暂无数据，在WorkBuddy中使用左脑后开始记录")
                self._platform_label.configure(text="--")
                self._cost_detail_label.configure(text="暂无数据")
        except Exception:
            self._consumed_label.configure(text="读取中...")

        self._time_str.configure(text=f"{datetime.now().strftime('%H:%M')}")
        if self._running:  # v3.3: 仅在窗口存活时继续调度
            self.after(5000, self._refresh)  # v3.4: 5秒刷新（降低CPU占用）

    def _update_dashboard(self, data):
        """V3 仪表盘更新：实时消耗+精准费用"""
        is_db = "counters" in data

        if is_db:
            # SQLite来源
            if self._mode == "today":
                consumed = data.get("today_consumed", 0)
                saved = data.get("today_saved", 0)
                consumed_cost = data.get("today_cost", 0)
                saved_cost = data.get("today_saved_cost", 0)
                ops = data.get("today_ops", 0)
                # v3.4: 今日无数据时自动回退到累计模式，避免用户看到一片空白
                if consumed == 0 and saved == 0 and ops == 0:
                    total_has_data = (data.get("total_consumed", 0) > 0 or 
                                     data.get("token_savings", 0) > 0 or
                                     data.get("total_ops", 0) > 0)
                    if total_has_data:
                        self._mode = "total"
                        self._mode_btn.configure(text="累计(全部历史)", fg=self.YELLOW, bg=self.CARD)
                        self._mode_indicator.configure(text="⚠️ 今日暂无操作，已自动切换至全部历史数据")
                        consumed = data.get("total_consumed", 0)
                        saved = data.get("token_savings", 0)
                        consumed_cost = data.get("total_cost", 0)
                        saved_cost = data.get("money_saved", 0)
                        ops = data.get("total_ops", 0)
            else:
                consumed = data.get("total_consumed", 0)
                saved = data.get("token_savings", 0)
                consumed_cost = data.get("total_cost", 0)
                saved_cost = data.get("money_saved", 0)
                ops = data.get("total_ops", 0)

            # v3.4: 更新模式指示器
            if self._mode == "today":
                self._mode_indicator.configure(text="📅 今日数据" if ops > 0 else "")
            else:
                self._mode_indicator.configure(text="")

            time_s = data.get("time_saved_s", 0)
            speed = data.get("equiv_speed", 0)
            daily = data.get("daily_save_h", 0)
            co2 = data.get("co2_saved", 0)
            days = data.get("days_active", 1)
            lc = data.get("learn_count", 0)
            qc = data.get("query_count", 0)
            scenes = data.get("scenes", {})

            # 平台分布
            realtime = data.get("realtime", {})
            platforms = realtime.get("platforms", {})
            models = realtime.get("models", {})
        else:
            # JSON来源（v3.4修复：不再伪造数据）
            lc = data.get("learn_count", 0)
            qc = data.get("query_count", 0)
            sc = data.get("search_count", 0)
            cc = data.get("correct_count", 0)
            ac = data.get("analyze_count", 0)
            suc = data.get("summarize_count", 0)
            ec = data.get("entangle_count", 0)
            token_savings = data.get("token_savings", 0)
            total_ops = lc + qc + sc + cc + ac + suc + ec
            # JSON模式无真实API消耗记录，设为0（不做假数据）
            consumed = 0
            saved = token_savings
            consumed_cost = 0.0
            # 节省费用按默认模型定价估算
            try:
                saved_cost = token_savings / 1000 * TokenPricer.get_price(TokenPricer.DEFAULT_MODEL, "output")
            except Exception:
                saved_cost = token_savings / 1000 * 0.002  # 默认输出价格 ¥0.002/K
            ops = total_ops
            # 时间估算基于操作次数（每次操作平均节省2秒）
            time_s = total_ops * 2.0
            days = 1
            first_used = data.get("first_use_at")
            if first_used:
                try:
                    days = max(1, (datetime.now() - datetime.fromisoformat(first_used)).days)
                except Exception:
                    pass
            daily = time_s / 3600 / max(1, days)
            speed = token_savings / max(1, time_s) if time_s > 0 else 0
            # 统一CO2：每操作次约 0.042g（基于LLM推理碳排放估算）
            co2 = total_ops * 0.042
            # 从 scene_counts 提取平台分布
            platforms = {}
            scene_data = data.get("scene_counts", {})
            if scene_data:
                platforms["左脑"] = {"consumed": token_savings, "saved": 0}
            models = {}
            scenes = scene_data

        # ===== 更新核心指标 =====
        self._consumed_label.configure(text=fmt_number(consumed))
        self._consumed_cost_label.configure(text=fmt_money(consumed_cost))

        self._saved_label.configure(text=fmt_number(saved))
        self._saved_cost_label.configure(text=f"省 {fmt_money(saved_cost)}")

        # 节省率进度条（v3.4修复：saved相对于预估无左脑消耗的占比）
        # 预估无左脑消耗 = consumed + saved（即实际消耗 + 左脑帮忙省下的）
        estimated_raw = consumed + saved
        if estimated_raw > 0:
            rate = saved / estimated_raw
            pct_text = f"{rate*100:.1f}%"
        else:
            rate = 0
            pct_text = "—"

        self._rate_canvas.delete("all")
        bar_w = 160
        self._rate_canvas.create_rectangle(0, 0, bar_w, 10, fill=self.CARD2, outline="")
        if estimated_raw > 0 and consumed > 0:
            consumed_w = int(bar_w * consumed / estimated_raw)
            self._rate_canvas.create_rectangle(0, 0, consumed_w, 10, fill=self.ORANGE, outline="")
        if estimated_raw > 0 and saved > 0:
            saved_start = int(bar_w * consumed / estimated_raw)
            self._rate_canvas.create_rectangle(saved_start, 0, bar_w, 10, fill=self.GREEN, outline="")

        self._rate_label.configure(text=pct_text)

        # ===== 平台分布 =====
        if platforms:
            plat_parts = []
            for plat, info in sorted(platforms.items(), key=lambda x: -x[1]["consumed"]):
                plat_parts.append(f"{plat}:{fmt_number(info['consumed'])}")
            self._platform_label.configure(text=" | ".join(plat_parts[:4]))

            # 平台Canvas柱状图
            self._platform_canvas.delete("all")
            max_plat = max(p["consumed"] for p in platforms.values()) if platforms else 1
            x = 4
            colors = [self.ACCENT, self.GREEN, self.ORANGE, self.YELLOW, self.RED]
            for i, (plat, info) in enumerate(sorted(platforms.items(), key=lambda x: -x[1]["consumed"])[:5]):
                bw = int(250 * info["consumed"] / max(max_plat, 1))
                color = colors[i % len(colors)]
                self._platform_canvas.create_rectangle(x, 4, x + max(bw, 10), 26, fill=color, outline="")
                self._platform_canvas.create_text(x + 5, 25, text=plat[:8],
                                                   fill="white", font=("微软雅黑", 7), anchor="w")
                x += max(bw, 10) + 4
        else:
            self._platform_label.configure(text="暂无平台数据")

        # ===== 时间统计 =====
        self._time_label.configure(text=f"⏱{fmt_time(time_s/3600)}")
        self._speed_label.configure(text=f"⚡{speed:,.0f}t/s")
        self._daily_label.configure(text=f"日均{fmt_time(daily)}")
        self._co2_label.configure(text=f"🌱{co2:.1f}g|{days}天")

        # ===== 费用明细 =====
        if consumed_cost > 0 or saved_cost > 0:
            net_cost = max(0, consumed_cost - saved_cost)
            detail = f"消耗 {fmt_money(consumed_cost)} → 节省 {fmt_money(saved_cost)} → 净花费 {fmt_money(net_cost)}"
            if _DB_OK:
                try:
                    model_info = TokenPricer.get_model_name(TokenPricer.DEFAULT_MODEL)
                    detail += f"\n计价模型: {model_info} (输入¥{TokenPricer.get_price(TokenPricer.DEFAULT_MODEL, 'input')}/K 输出¥{TokenPricer.get_price(TokenPricer.DEFAULT_MODEL, 'output')}/K)"
                except Exception:
                    pass
            self._cost_detail_label.configure(text=detail)
        else:
            self._cost_detail_label.configure(text="暂无费用数据，使用左脑后自动记录")

        # ===== 操作统计 =====
        self._ops_label.configure(text=f"操作 {ops}次")

        # ===== 使用习惯 =====
        scene_str = " | ".join([f"{k}{v}" for k, v in sorted(scenes.items(), key=lambda x: -x[1])[:3]]) if scenes else ""
        total_all = ops
        if total_all > 0:
            mem = lc + qc
            reasoning = total_all - mem
            if mem > reasoning * 1.5:
                pattern = "记忆达人 🧠"
            elif reasoning > mem * 1.5:
                pattern = "推理高手 🔍"
            else:
                pattern = "均衡型 ⚖️"
        else:
            pattern = "未开始"
        tags = f"🧠 {pattern}" + (f"  {scene_str}" if scene_str else "")
        self._habit_label.configure(text=tags)

        # 优化建议
        tips = self._generate_tips(data)
        if tips:
            self._last_tips = tips
            self._tip_index = (self._tip_index + 1) % len(tips)
            self._tip_label.configure(text=tips[self._tip_index])
        elif self._last_tips:
            self._tip_index = (self._tip_index + 1) % len(self._last_tips)
            self._tip_label.configure(text=self._last_tips[self._tip_index])

    def _generate_tips(self, data):
        """生成优化建议"""
        if data is None:
            return ["✅ 在WorkBuddy中使用 /左脑 learn 学习知识",
                    "✅ 使用 /左脑 query 查询已有知识",
                    "✅ 使用 /左脑 search 图扩散搜索关联知识"]
        tips = []
        lc = data.get("learn_count", 0)
        qc = data.get("query_count", 0)
        sc = data.get("search_count", 0)
        ac = data.get("analyze_count", 0)
        suc = data.get("summarize_count", 0)

        consumed = data.get("today_consumed", 0) or data.get("total_consumed", 0)
        saved = data.get("today_saved", 0) or data.get("token_savings", 0)
        if consumed > 0 and saved > 0:
            rate = saved / (consumed + saved) * 100
            if rate > 50:
                tips.append(f"💡 当前节省率 {rate:.0f}%，左脑已帮你大幅降低API消耗")
            elif rate < 20:
                tips.append(f"💡 节省率仅 {rate:.0f}%，多用左脑learn/query可提升节省率")

        if lc > 0 and sc == 0:
            tips.append("🔍 试试图扩散搜索 /左脑 search 挖隐藏关联")
        if ac > 3 and suc == 0:
            tips.append("📄 试试 /左脑 summarize 提炼核心结论")

        if not tips:
            tips.append("✅ 当前使用状态很好，继续保持！")
            tips.append("💡 Ctrl+Alt+T 快捷键可快速呼出监测助手")
            tips.append("📥 点击标题栏📥按钮可导出数据为CSV")
        return tips

    # ====================== 趋势图绘制 ======================

    def _draw_trend_chart(self, mode=None):
        """v3.4: mode参数支持 today/total 联动"""
        if mode is None:
            mode = self._mode
        if not _DB_OK:
            self._trend_canvas.delete("all")
            self._trend_canvas.create_text(140, 100, text="需要token_db模块",
                                            fill=self.TEXT2, font=("微软雅黑", 9))
            return

        try:
            snapshots = get_daily_snapshots(7)
        except Exception:
            snapshots = []

        canvas = self._trend_canvas
        canvas.delete("all")

        if not snapshots:
            canvas.create_text(140, 100, text="暂无历史数据",
                              fill=self.TEXT2, font=("微软雅黑", 9))
            return

        snapshots.reverse()
        w, h = 280, 200
        pad_l, pad_r, pad_t, pad_b = 40, 10, 20, 25
        chart_w = w - pad_l - pad_r
        chart_h = h - pad_t - pad_b

        # 消耗/节省双线图
        consumed_vals = [s.get("today_consumed", s.get("today_tokens", 0)) for s in snapshots]
        saved_vals = [s.get("token_savings", 0) for s in snapshots]
        all_vals = consumed_vals + saved_vals
        max_val = max(all_vals) if all_vals else 1
        if max_val == 0:
            max_val = 1

        # 网格
        for i in range(5):
            y = pad_t + chart_h * i / 4
            canvas.create_line(pad_l, y, w - pad_r, y, fill=self.BORDER, dash=(2, 4))
            val = max_val * (1 - i / 4)
            canvas.create_text(pad_l - 3, y, text=fmt_number(int(val)),
                              fill=self.TEXT2, font=("微软雅黑", 7), anchor="e")

        # 消耗折线（橙色）
        c_points = []
        for i, v in enumerate(consumed_vals):
            x = pad_l + chart_w * i / max(len(consumed_vals) - 1, 1)
            y = pad_t + chart_h * (1 - v / max_val)
            c_points.append((x, y))

        if len(c_points) >= 2:
            line_pts = [coord for p in c_points for coord in p]
            canvas.create_line(*line_pts, fill=self.ORANGE, width=2, smooth=True)
            for x, y in c_points:
                canvas.create_oval(x-2, y-2, x+2, y+2, fill=self.ORANGE, outline="")

        # 节省折线（绿色）
        s_points = []
        for i, v in enumerate(saved_vals):
            x = pad_l + chart_w * i / max(len(saved_vals) - 1, 1)
            y = pad_t + chart_h * (1 - v / max_val)
            s_points.append((x, y))

        if len(s_points) >= 2:
            line_pts = [coord for p in s_points for coord in p]
            canvas.create_line(*line_pts, fill=self.GREEN, width=2, smooth=True)
            for x, y in s_points:
                canvas.create_oval(x-2, y-2, x+2, y+2, fill=self.GREEN, outline="")

        # 日期标签
        for i, s in enumerate(snapshots):
            x = pad_l + chart_w * i / max(len(snapshots) - 1, 1)
            canvas.create_text(x, pad_t + chart_h + 10, text=s["date"][-5:],
                              fill=self.TEXT2, font=("微软雅黑", 7))

        # 图例
        canvas.create_rectangle(pad_l, 2, pad_l+10, 8, fill=self.ORANGE, outline="")
        canvas.create_text(pad_l+14, 5, text="消耗", fill=self.ORANGE, font=("微软雅黑", 7), anchor="w")
        canvas.create_rectangle(pad_l+45, 2, pad_l+55, 8, fill=self.GREEN, outline="")
        canvas.create_text(pad_l+59, 5, text="节省", fill=self.GREEN, font=("微软雅黑", 7), anchor="w")

        # 操作趋势图
        ops_canvas = self._ops_canvas
        ops_canvas.delete("all")

        ops_values = [s["total_ops"] for s in snapshots]
        max_ops = max(ops_values) if ops_values else 1
        if max_ops == 0:
            max_ops = 1

        oh = 120
        opad_t, opad_b = 15, 20
        och = oh - opad_t - opad_b

        bar_w = max(10, chart_w / max(len(ops_values), 1) - 4)
        for i, v in enumerate(ops_values):
            x = pad_l + chart_w * i / max(len(ops_values) - 1, 1) - bar_w / 2
            bh = och * v / max_ops
            y = opad_t + och - bh
            color = self.GREEN if v > 0 else self.BORDER
            ops_canvas.create_rectangle(x, y, x + bar_w, opad_t + och,
                                        fill=color, outline="")
            ops_canvas.create_text(x + bar_w/2, opad_t + och + 8,
                                  text=snapshots[i]["date"][-5:],
                                  fill=self.TEXT2, font=("微软雅黑", 7))

        if snapshots:
            latest = snapshots[-1]
            self._trend_info.configure(
                text=f"最新: 消耗{fmt_number(latest.get('today_consumed', 0))} 节省{fmt_number(latest['token_savings'])} | 操作{latest['total_ops']}次"
            )

    # ====================== 热力图绘制 ======================

    def _draw_heatmap(self, mode=None):
        """v3.4: mode参数支持 today/total 联动"""
        if mode is None:
            mode = self._mode
        if not _DB_OK:
            self._heatmap_canvas.delete("all")
            self._heatmap_canvas.create_text(140, 110, text="需要token_db模块",
                                              fill=self.TEXT2, font=("微软雅黑", 9))
            return

        try:
            data = get_hourly_data()
        except Exception:
            data = []

        canvas = self._heatmap_canvas
        canvas.delete("all")

        w, h = 280, 220
        cols = 6
        rows = 4
        pad = 5
        cell_w = (w - pad * 2) / cols - 2
        cell_h = (h - pad * 2 - 20) / rows - 2

        max_ops = max(d["ops"] for d in data) if data else 1
        if max_ops == 0:
            max_ops = 1

        peak_hour = 0
        peak_ops = 0
        total_ops = 0

        for d in data:
            hour = d["hour"]
            ops = d["ops"]
            tokens = d["tokens"]
            row = hour // cols
            col = hour % cols
            x = pad + col * (cell_w + 2)
            y = pad + 8 + row * (cell_h + 2)

            intensity = ops / max_ops
            if ops == 0:
                color = "#0d1423"
            elif intensity < 0.25:
                color = "#0d3b66"
            elif intensity < 0.5:
                color = "#1a6fb5"
            elif intensity < 0.75:
                color = "#2d9cdb"
            else:
                color = "#00dc82"

            canvas.create_rectangle(x, y, x + cell_w, y + cell_h,
                                   fill=color, outline=self.BORDER)
            canvas.create_text(x + cell_w/2, y + cell_h/2 - 5,
                              text=f"{hour:02d}",
                              fill=self.TEXT1, font=("Consolas", 8, "bold"))
            if ops > 0:
                canvas.create_text(x + cell_w/2, y + cell_h/2 + 6,
                                  text=str(ops),
                                  fill=self.TEXT2, font=("Consolas", 7))

            if ops > peak_ops:
                peak_ops = ops
                peak_hour = hour
            total_ops += ops

        canvas.create_text(w/2, h - 5, text="0-5  6-11  12-17  18-23",
                          fill=self.TEXT2, font=("Consolas", 7))

        self._heatmap_info.configure(
            text=f"🔥 高峰: {peak_hour:02d}:00 ({peak_ops}次) | 今日总操作: {total_ops}次"
        )

    # ====================== 成就更新 ======================

    def _update_achievements(self, mode=None):
        """v3.4: mode参数支持 today/total 联动"""
        if mode is None:
            mode = self._mode
        if not _DB_OK:
            return
        try:
            achs = get_achievements()
            unlocked = [a for a in achs if a["unlocked"]]
            locked = [a for a in achs if not a["unlocked"]]
        except Exception:
            return

        self._achieve_text.configure(state="normal")
        self._achieve_text.delete("1.0", "end")

        self._achieve_text.insert("end", f"🏆 成就 ({len(unlocked)}/{len(achs)} 已解锁)\n", "title")
        self._achieve_text.insert("end", "═" * 30 + "\n\n", "divider")

        if unlocked:
            self._achieve_text.insert("end", "✅ 已解锁：\n", "section")
            for a in unlocked:
                self._achieve_text.insert("end", f"  {a['icon']} {a['name']}\n", "unlocked")
                self._achieve_text.insert("end", f"     {a['description']}\n", "desc")

        if locked:
            self._achieve_text.insert("end", f"\n🔒 未解锁 ({len(locked)}项)：\n", "section")
            for a in locked[:10]:
                self._achieve_text.insert("end", f"  {a['icon']} {a['name']}\n", "locked")
                self._achieve_text.insert("end", f"     {a['description']}\n", "desc")

        self._achieve_text.tag_configure("title", foreground=self.YELLOW,
                                          font=("微软雅黑", 9, "bold"))
        self._achieve_text.tag_configure("divider", foreground=self.BORDER)
        self._achieve_text.tag_configure("section", foreground=self.ACCENT,
                                          font=("微软雅黑", 8, "bold"))
        self._achieve_text.tag_configure("unlocked", foreground=self.GREEN)
        self._achieve_text.tag_configure("locked", foreground=self.TEXT2)
        self._achieve_text.tag_configure("desc", foreground=self.TEXT2)

        self._achieve_text.configure(state="disabled")

    # ====================== 成就弹窗 ======================

    def _show_achievement_popup(self, newly_unlocked):
        if not newly_unlocked:
            return
        for ach in newly_unlocked:
            popup = tk.Toplevel(self)
            popup.overrideredirect(True)
            popup.attributes("-topmost", True)
            popup.configure(bg=self.CARD)

            frame = tk.Frame(popup, bg=self.CARD, padx=12, pady=8)
            frame.pack()

            tk.Label(frame, text=f"{ach['icon']} 成就解锁！",
                    font=("微软雅黑", 11, "bold"),
                    bg=self.CARD, fg=self.YELLOW).pack()
            tk.Label(frame, text=f"{ach['name']} — {ach['description']}",
                    font=("微软雅黑", 9),
                    bg=self.CARD, fg=self.TEXT1).pack()

            sw = self.winfo_screenwidth()
            popup.geometry(f"+{sw//2 - 120}+{50}")
            popup.after(3000, popup.destroy)

    # ====================== 数据导出 ======================

    def _export_csv(self):
        if not _DB_OK:
            messagebox.showinfo("导出", "需要token_db模块")
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV文件", "*.csv"), ("所有文件", "*.*")],
            initialfile=f"left_brain_v3_{datetime.now().strftime('%Y%m%d')}.csv"
        )
        if not filepath:
            return

        try:
            export_csv_to_file(filepath, "all", 30)
            messagebox.showinfo("导出成功", f"数据已导出到：\n{filepath}")
        except Exception as e:
            messagebox.showerror("导出失败", str(e))

    # ====================== Socket 通信 ======================

    def _on_engine_message(self, msg):
        msg_type = msg.get("type", "")
        if msg_type == "achievement":
            self.after(0, lambda: self._show_achievement_popup([msg.get("achievement", {})]))
        elif msg_type == "refresh":
            self.after(0, self._refresh, True)
        elif msg_type == "today_reset":
            if self._mode == "today":
                self.after(0, self._refresh, True)

    # ====================== 定时快照 ======================

    def _snapshot_timer(self):
        if _DB_OK:
            try:
                data = load_engine_stats()
                if data and isinstance(data, dict):
                    nodes_count = data.get("nodes_count", 0)
                    edges_count = data.get("edges_count", 0)
                    if nodes_count == 0 and "nodes" in data:
                        nodes_count = len(data["nodes"]) if isinstance(data["nodes"], list) else 0
                        edges_count = sum(len(n.get("edges", [])) for n in data["nodes"]) // 2 if nodes_count > 0 else 0
                    save_daily_snapshot(nodes_count, edges_count)
            except Exception:
                pass
        if self._running:
            self.after(300000, self._snapshot_timer)

    # ====================== 模式切换 ======================

    def _toggle_mode(self):
        if self._mode == "total":
            self._mode = "today"
            self._mode_btn.configure(text="今日", fg=self.GREEN, bg=self.CARD)
        else:
            self._mode = "total"
            self._mode_btn.configure(text="累计(全部历史)", fg=self.YELLOW, bg=self.CARD)
        self._refresh(force=True)

    # ====================== 关闭 ======================

    def _toggle_topmost(self, event=None):
        """v3.4: 双击标题栏切换窗口置顶"""
        current = self.attributes("-topmost")
        self.attributes("-topmost", not current)
        # 在标题栏显示状态，不覆盖模式按钮
        status = "📌" if not current else ""
        self._title_text.configure(text=f"ToKen V3 实时统计 {status}")

    def _on_close(self):
        self._running = False  # v3.3: 停止所有定时器回调
        self._save_position()
        if self._bridge:
            self._bridge.stop_server()
        self.destroy()


# ====================== 入口 ======================
if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    if _DB_OK:
        ensure_db()

    if not _DB_OK and not DATA_FILE.exists():
        print("📊 ToKen 监测助手 V3")
        print("=" * 30)
        print("⏳ 尚未检测到左脑运行数据")
        print("   请先使用左脑功能后再启动本助手")
        print()
        print("数据路径: " + str(DATA_FILE))
        if not hasattr(sys, "ps1") or not sys.stdin.isatty():
            print("将以空数据状态启动...")
        else:
            input("按回车继续启动监测窗口...")

    app = TokenMonitorV3()
    app.mainloop()
