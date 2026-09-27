// sidebar-panel —— 侧边面板 composer 的听写控制层。
//
// 原版：app/webview/assets/sidebar-panel-bd17eff5e383.js。
// 六个导出（压缩名 → 语义）：
//   a = SidebarPanelDictationController
//   i = sidebarPanelAttachmentIcons
//   n = renderSidebarPanelDisclosure
//   o/r/t = 上述三组功能的懒初始化器

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  BQ: initializeDictationRecorder,
  J: initializeDictationErrors,
  RQ: mergeDictationTranscript,
  Rrt: initializeDisclosure,
  Urt: Disclosure,
  X: initializeDictationTranscription,
  Y: isDictationEnabled,
  Z: useDictation,
  _t: DictationButton,
  vt: DictationRecordingOverlay,
  yt: initializeDictation,
} = appInitialChunk;
const {
  FX: initializeSignalRuntime,
  Fs: InsertIcon16,
  I3: getJsxRuntime,
  Ix: FormatIcon16,
  K2: initializeIntl,
  LX: useSignalScope,
  Lx: FormatIcon20,
  Ms: initializeInsertIcons,
  Ns: InsertIcon20,
  Ps: initializeImageIcons,
  QI: initializeQueryRuntime,
  ZI: applicationScope,
  e6: reactRuntime,
  lg: AnimatedIcon,
  lk: initializeToastUi,
  lw: initializeImportIcons,
  n4: useIntl,
  nS: ImageIcon16,
  pk: toastManagerSignal,
  rS: ImageIcon20,
  ug: initializeFormatIcons,
} = appSharedChunk;

export interface SidebarPanelDictationRenderState {
  dictationButton: unknown;
  isBusy: boolean;
  isDictating: boolean;
  recordingOverlay: unknown;
}

export interface SidebarPanelDictationProps {
  children(state: SidebarPanelDictationRenderState): unknown;
  onBusyChange?(busy: boolean): void;
  onChange(value: string): void;
  onSubmit(value: string): void;
  tooltipPortalContainer?: Element | null;
  value: string;
}

let React: import("@rchunk/app-shared").ReactRuntime | null = null;
let jsx: import("@rchunk/app-shared").JsxRuntime | null = null;

/** 装配 React、scope、toast 与 dictation 运行时（原 `R`）。 */
function initializeSidebarPanelDictation(): void {
  initializeSignalRuntime?.();
  initializeIntl?.();
  initializeDictation?.();
  initializeDictationRecorder?.();
  initializeDictationTranscription?.();
  initializeDictationErrors?.();
  initializeToastUi?.();
  initializeQueryRuntime?.();
  React ??=
    typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  jsx ??=
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

/**
 * 侧边面板听写控制层（原 `P`）。
 *
 * transcript insert 通过官方 `RQ` 合并到当前文本；send 会先
 * trim，空结果不提交。busy 在 unmount 时必定回落为 false。
 */
function SidebarPanelDictationController(props: SidebarPanelDictationProps): unknown {
  initializeSidebarPanelDictation();
  const react = React as import("@rchunk/app-shared").ReactRuntime;
  const renderer = jsx as import("@rchunk/app-shared").JsxRuntime;
  const scope = useSignalScope(applicationScope);
  const intl = useIntl();
  const valueRef = react.useRef(props.value);
  react.useEffect(() => {
    valueRef.current = props.value;
  }, [props.value]);

  const mergeTranscript = (transcript: string) =>
    mergeDictationTranscript(valueRef.current, transcript);
  const onTranscriptInsert = (transcript: string) => {
    const next = mergeTranscript(transcript);
    valueRef.current = next;
    props.onChange(next);
  };
  const onTranscriptSend = (transcript: string) => {
    const next = mergeTranscript(transcript);
    valueRef.current = next;
    const trimmed = next.trim();
    if (trimmed.length !== 0) {
      props.onChange(next);
      props.onSubmit(trimmed);
    }
  };

  const showError = (id: string, defaultMessage: string, description: string) => {
    scope.get(toastManagerSignal).danger(
      String(intl.formatMessage({ id, defaultMessage, description })),
      { errorAnalytics: { toastId: id } },
    );
  };
  const enabled = isDictationEnabled() === true;
  const dictation = useDictation({
    enabled,
    getSurroundingText: () => valueRef.current,
    onTranscriptInsert,
    onTranscriptSend,
    onStartError: () =>
      showError(
        "composer.dictation.startError",
        "Unable to start dictation",
        "Toast text shown when dictation could not be started",
      ),
    onTranscribeError: () =>
      showError(
        "composer.dictation.transcribeError",
        "Unable to transcribe audio",
        "Toast text shown when dictation audio transcription fails",
      ),
    onUnsupported: () =>
      showError(
        "composer.dictation.unsupported",
        "Dictation is not available on this device",
        "Toast text shown when dictation is not supported on the current device",
      ),
  });

  const isBusy =
    dictation.isDictationStarting ||
    dictation.isDictating ||
    dictation.isTranscribing;
  react.useEffect(() => {
    props.onBusyChange?.(isBusy);
    return () => props.onBusyChange?.(false);
  }, [isBusy, props.onBusyChange]);

  const dictationButton =
    dictation.hostCapability == null || enabled
      ? renderer.jsx(DictationButton, {
          isVisible: true,
          isStarting: dictation.isDictationStarting,
          isTranscribing: dictation.isTranscribing,
          canRetryDictation: dictation.canRetryDictation,
          disabled: dictation.hostCapability == null,
          retryDictation: dictation.retryDictation,
          shortcutLabel: null,
          startDictation: dictation.startDictation,
          stopDictation: dictation.stopDictation,
          tooltipPortalContainer: props.tooltipPortalContainer,
        })
      : null;
  const recordingOverlay =
    dictation.isDictating || dictation.isTranscribing
      ? renderer.jsx("div", {
          className:
            "absolute inset-0 z-20 flex flex-col justify-center bg-surface-elevated-secondary",
          children: renderer.jsx(DictationRecordingOverlay, {
            transcriptionAction: dictation.transcriptionAction,
            waveformCanvasRef: dictation.waveformCanvasRef,
            stopDictation: dictation.stopDictation,
            noBottomMargin: true,
            tooltipPortalContainer: props.tooltipPortalContainer,
          }),
        })
      : null;

  return props.children({
    dictationButton,
    recordingOverlay,
    isBusy,
    isDictating: dictation.isDictating,
  });
}

/** 侧边面板附件类型的动画图标映射（原 `B`）。 */
let sidebarPanelAttachmentIcons: Record<string, unknown> = {};

function initializeSidebarPanelAttachmentIcons(): void {
  initializeImageIcons?.();
  initializeInsertIcons?.();
  initializeImportIcons?.();
  initializeFormatIcons?.();
  const renderer = (jsx ??=
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime);
  sidebarPanelAttachmentIcons = {
    image: renderer.jsx(AnimatedIcon, {
      icon: { 16: ImageIcon16, 20: ImageIcon20 },
    }),
    insert: renderer.jsx(AnimatedIcon, {
      icon: { assets: { 16: InsertIcon16, 20: InsertIcon20 } },
    }),
    format: renderer.jsx(AnimatedIcon, {
      icon: { 16: FormatIcon16, 20: FormatIcon20 },
    }),
  };
}

/** Framer Motion 高度自动展开容器（原 `H`）。 */
function renderSidebarPanelDisclosure(children: unknown, open: boolean): unknown {
  initializeSidebarPanelDisclosure();
  return (jsx as import("@rchunk/app-shared").JsxRuntime).jsx(Disclosure, {
    className: "pointer-events-auto",
    height: "content",
    open,
    children,
  });
}

function initializeSidebarPanelDisclosure(): void {
  initializeDisclosure?.();
  jsx ??=
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

export {
  SidebarPanelDictationController as a,
  sidebarPanelAttachmentIcons as i,
  renderSidebarPanelDisclosure as n,
  initializeSidebarPanelDictation as o,
  initializeSidebarPanelAttachmentIcons as r,
  initializeSidebarPanelDisclosure as t,
};
