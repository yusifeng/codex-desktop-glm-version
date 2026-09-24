// avatar overlay 常量族（原版 359-394、15,033-15,705、18,171-18,180 区段）。
//
// 内容：弹簧/外观度量（Me/Ne/Pe/Fe）、realtime 启动超时（tle/nle）、
// dock 磁吸物理（Bu/Vu/ale/ole）、窗口几何常量（Uu..Vle）、PIP i18n 文案
// id（Xle..aue）。纯常量 + 纯函数，无模块加载期副作用。

// ---------------------------------------------------------------------------
// 弹簧与外观（原 359-394）
// ---------------------------------------------------------------------------

/** 窗口运动弹簧参数（原 Me，359）。 */
export const MOVEMENT_SPRING = { damping: 18.85, initialVelocity: 0, mass: 1, stiffness: 180 };

/** Quick Chat 吸附时的最小宽度（px，原 Ne，360）。 */
export const QUICK_CHAT_MIN_SNAP_WIDTH_PX = 330;

/** Quick Chat 静置宽度（原 Pe，361-364）：按通知位有无展开。 */
export function quickChatRestingWidth(hasNotifications: boolean): number {
  let tiers = 2 + +!!hasNotifications;
  return 20 + 20 * tiers + 20 * (tiers - 1);
}

/** 默认宠物控件外观度量（原 Fe，365-390）。 */
export const DEFAULT_PET_CONTROLS_APPEARANCE = {
  collapseMovementSpringBounce: 0.1,
  collapseTransitionDurationMs: 0,
  compactControlCornerRadius: 6.5,
  compactControlGap: -10.5,
  compactControlHeight: 6,
  compactControlWidth: 17,
  compactDismissDelayMs: 300,
  compactGlassSpacing: 14,
  compactOffsetX: 0,
  compactOffsetY: 0,
  contentHiddenBlurRadiusPx: 14,
  contentHiddenScale: 0.75,
  expandingGlassSpacing: 20,
  glassMergeDurationMs: 300,
  hoverControlGap: 8,
  hoverControlSize: 24,
  hoverGlassSpacing: 0,
  hoverOffsetX: 0,
  hoverOffsetY: 10,
  movementSpringBounce: 0.1,
  movementSpringLaunchOffsetY: 16,
  proximityEnterDistance: 40,
  proximityExitDistance: 56,
  transitionDurationMs: 200,
} as Record<string, number>;

// ---------------------------------------------------------------------------
// realtime 语音启动超时（原 15,033-15,034）
// ---------------------------------------------------------------------------

/** 主窗口语音启动超时（ms，原 tle = 3e4）。 */
export const REALTIME_LAUNCH_TIMEOUT_MS = 30_000;

/** 已挂接 starter 后的连接超时（ms，原 nle = 1e4）。 */
export const REALTIME_CONNECTED_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// dock 磁吸物理（原 15,271-15,274）
// ---------------------------------------------------------------------------

/** 磁吸加速度作用半径（px，原 Bu = 720）。 */
export const DOCK_ACCELERATION_RADIUS_PX = 720;

/** 入坞判定距离（px，原 Vu = 72）。 */
export const DOCK_DISTANCE_PX = 72;

/** 最大加速度（px/s²，原 ale = 48e3）。 */
export const DOCK_MAX_ACCELERATION = 48_000;

/** 加速度方向余弦阈值（原 ole = 0.2）。 */
export const DOCK_COSINE_THRESHOLD = 0.2;

// ---------------------------------------------------------------------------
// 布局常量（原 15,331-15,341）
// ---------------------------------------------------------------------------

/** legacy 视口尺寸（原 Uu）。 */
export const LEGACY_VIEWPORT_SIZE = { width: 356, height: 320 };

/** native 视口尺寸（原 Wu）。 */
export const NATIVE_VIEWPORT_SIZE = { width: 384, height: 400 };

/** native 模式的玻璃边距（原 Gu）。 */
export const GLASS_MARGINS = { top: 8, right: 28, bottom: 8, left: 0 };

/** 实时字幕与吉祥物的间距（px，原 Ku = 24）。 */
export const CAPTION_GAP_PX = 24;

/** 吉祥物与其他元素的垂直间距（px，原 qu = 4）。 */
export const ELEMENT_GAP_PX = 4;

/** 已入坞 PIP 栈的额外间距（px，原 ule = 12）。 */
export const DOCKED_PIP_STACK_GAP_PX = 12;

/** 宠物控件行的默认高度（px，原 dle = 32）。 */
export const PET_CONTROL_ROW_HEIGHT_PX = 32;

/** 字幕保留高度修正（px，原 fle = 8）。 */
export const CAPTION_RESERVE_PX = 8;

/** native 窗口内边距（px，原 Ju = 12）。 */
export const NATIVE_INSET_PX = 12;

/** 弹簧过冲比（原 Yu = e^{-πd/√(4mk−d²)}）与补偿因子（原 ple = Yu/(1-Yu)）。 */
const springOvershoot = Math.exp(
  (-Math.PI * MOVEMENT_SPRING.damping) /
    Math.sqrt(4 * MOVEMENT_SPRING.mass * MOVEMENT_SPRING.stiffness - MOVEMENT_SPRING.damping ** 2),
);
/** 弹簧安全余量因子（原 ple）。 */
export const SPRING_MARGIN_FACTOR = springOvershoot / (1 - springOvershoot);

// ---------------------------------------------------------------------------
// 窗口常量（原 15,674-15,705）
// ---------------------------------------------------------------------------

/** avatar overlay 的渲染路由（原 xle）。 */
export const AVATAR_OVERLAY_ROUTE = `/avatar-overlay`;

/** 远程托管 PIP 的内容宿主 id（原 ld）。 */
export const AVATAR_OVERLAY_HOST_ID = `avatar-overlay`;

/** Quick Chat 展开时的上下留白（px，原 ud = 8）。 */
export const QUICK_CHAT_MARGIN_PX = 8;

/** 默认边距（px，原 dd = 24）。 */
export const DEFAULT_MARGIN_PX = 24;

/** 淡入/淡出默认时长（ms，原 Sle = 300）。 */
export const FADE_DURATION_MS = 300;

/** 隐藏动画淡出时长（ms，原 Cle = 120）。 */
export const HIDE_FADE_DURATION_MS = 120;

/** 宠物控件邻近探测轮询间隔（ms，原 wle = 32）。 */
export const PROXIMITY_POLL_INTERVAL_MS = 32;

/** display 匹配容差（px，原 Tle = 24）。 */
export const DISPLAY_MATCH_TOLERANCE_PX = 24;

/** 吉祥物默认尺寸（原 fd）。 */
export const DEFAULT_MASCOT_SIZE = { width: 112, height: 121 };

/** 吉祥物最小/最大宽度（px，原 pd = 80 / Ele = 224）。 */
export const MASCOT_MIN_WIDTH_PX = 80;
export const MASCOT_MAX_WIDTH_PX = 224;

/** 吉祥物宽高比（原 Dle = 192/208）。 */
export const MASCOT_ASPECT_RATIO = 192 / 208;

/** native draw 的吉祥物尺寸（原 Ole = Ad(pd)）。 */
export const NATIVE_DRAW_MASCOT_SIZE = {
  width: MASCOT_MIN_WIDTH_PX,
  height: Math.ceil(MASCOT_MIN_WIDTH_PX / MASCOT_ASPECT_RATIO),
};

/** legacy / native 的 tray 尺寸（原 kle / Ale）。 */
export const LEGACY_TRAY_SIZE = { width: 330, height: 131 };
export const NATIVE_TRAY_SIZE = { width: 330, height: 141 };

/** 淡入起始不透明度（原 md = 0.01）。 */
export const FADE_START_OPACITY = 0.01;

/** 动画帧间隔（ms，原 hd = 16）。 */
export const ANIMATION_FRAME_MS = 16;

/** 动量衰减的每帧时间基数（ms，原 jle = 16）。 */
export const MOMENTUM_DECAY_FRAME_MS = 16;

/** 单帧最大步长（ms，原 gd = 32）。 */
export const MAX_FRAME_DELTA_MS = 32;

/** 动量每帧衰减系数（原 Mle = 0.88）。 */
export const MOMENTUM_FRAME_DECAY = 0.88;

/** 撞边反弹系数（原 _d = 0.7）。 */
export const BOUNCE_FACTOR = 0.7;

/** 动量停止的最小速度（px/s，原 Nle = 65）。 */
export const MOMENTUM_MIN_SPEED = 65;

/** 动量最大持续时间（ms，原 Ple = 900）。 */
export const MOMENTUM_MAX_DURATION_MS = 900;

/** 吸附动画的收敛时长上限（ms，原 Fle = 360）。 */
export const SNAP_SETTLE_MAX_DURATION_MS = 360;

/** 吸附弹簧：刚度/阻尼（原 yd = 220 / vd = 26）。 */
export const SNAP_SPRING_STIFFNESS = 220;
export const SNAP_SPRING_DAMPING = 26;

/** 吸附收敛距离/速度阈值（原 Ile = 3 / Lle = 80）。 */
export const SNAP_DISTANCE_THRESHOLD_PX = 3;
export const SNAP_SPEED_THRESHOLD_PX = 80;

/** 拖动结束后窗口位置持久化延迟（ms，原 Rle = 100）。 */
export const MOVED_WINDOW_PERSIST_DELAY_MS = 100;

/** 原生拖动轮询间隔（ms，原 zle = 50）。 */
export const NATIVE_DRAG_POLL_INTERVAL_MS = 50;

/** 脱离 display 的记忆保留时长（ms，原 Ble = 1e4）。 */
export const DETACHED_DISPLAY_REMEMBER_MS = 10_000;

/** 关闭后隐藏窗口的清理延迟（ms，原 Vle = 6e5）。 */
export const DISMISSED_WINDOW_CLEANUP_DELAY_MS = 600_000;

// ---------------------------------------------------------------------------
// remote-hosted PIP 的 i18n 文案（原 18,171-18,180）
// ---------------------------------------------------------------------------

export const PIP_CLOSE_CONTROL_TOOLTIP_MESSAGE = `desktop.remoteHostedPIP.closeControlTooltip`;
export const PIP_CLOSE_CONTROL_TOOLTIP_DEFAULT = `Return Picture-in-Picture to Codex`;
export const PIP_HIDE_CONTROL_MESSAGE = `desktop.remoteHostedPIP.hideControl`;
export const PIP_HIDE_CONTROL_DEFAULT = `Hide`;
export const PIP_HIDE_FOR_TASK_MESSAGE = `desktop.remoteHostedPIP.hideForTask`;
export const PIP_HIDE_FOR_TASK_DEFAULT = `Hide for this chat`;
export const PIP_HIDE_FOR_ALL_ACTIVE_TASKS_MESSAGE = `desktop.remoteHostedPIP.hideForAllActiveTasks`;
export const PIP_HIDE_FOR_ALL_ACTIVE_TASKS_DEFAULT = `Hide for all active chats`;
export const PIP_SEND_TO_PET_CONTROL_TOOLTIP_MESSAGE = `desktop.remoteHostedPIP.sendToPetControlTooltip`;
export const PIP_SEND_TO_PET_CONTROL_TOOLTIP_DEFAULT = `Send Picture-in-Picture to Pet`;
