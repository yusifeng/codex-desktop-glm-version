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

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<T>(value: T): { current: T };
}

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}

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

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;

function callInitializer(chunk: Record<string, any>, name: string): unknown {
  const initializer = chunk[name];
  return typeof initializer === "function" ? initializer() : initializer;
}

/** 装配 React、scope、toast 与 dictation 运行时（原 `R`）。 */
function initializeSidebarPanelDictation(): void {
  callInitializer(appShared, "FX");
  callInitializer(appShared, "K2");
  callInitializer(appInitial, "yt");
  callInitializer(appInitial, "BQ");
  callInitializer(appInitial, "X");
  callInitializer(appInitial, "J");
  callInitializer(appShared, "lk");
  callInitializer(appShared, "QI");
  React ??= callInitializer(appShared, "e6") as ReactRuntime;
  jsx ??= callInitializer(appShared, "I3") as JsxRuntime;
}

/**
 * 侧边面板听写控制层（原 `P`）。
 *
 * transcript insert 通过官方 `RQ` 合并到当前文本；send 会先
 * trim，空结果不提交。busy 在 unmount 时必定回落为 false。
 */
function SidebarPanelDictationController(props: SidebarPanelDictationProps): unknown {
  initializeSidebarPanelDictation();
  const react = React as ReactRuntime;
  const renderer = jsx as JsxRuntime;
  const scope = appShared.LX(appShared.ZI);
  const intl = appShared.n4();
  const valueRef = react.useRef(props.value);
  react.useEffect(() => {
    valueRef.current = props.value;
  }, [props.value]);

  const mergeTranscript = (transcript: string) => appInitial.RQ(valueRef.current, transcript);
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
    scope.get(appShared.pk).danger(
      intl.formatMessage({ id, defaultMessage, description }),
      { errorAnalytics: { toastId: id } },
    );
  };
  const enabled = appInitial.Y() === true;
  const dictation = appInitial.Z({
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
      ? renderer.jsx(appInitial._t, {
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
          children: renderer.jsx(appInitial.vt, {
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
  callInitializer(appShared, "Ps");
  callInitializer(appShared, "Ms");
  callInitializer(appShared, "lw");
  callInitializer(appShared, "ug");
  const renderer = (jsx ??= callInitializer(appShared, "I3") as JsxRuntime);
  const IconAsset = appShared.lg;
  sidebarPanelAttachmentIcons = {
    image: renderer.jsx(IconAsset, {
      icon: { 16: appShared.nS, 20: appShared.rS },
    }),
    insert: renderer.jsx(IconAsset, {
      icon: { assets: { 16: appShared.Fs, 20: appShared.Ns } },
    }),
    format: renderer.jsx(IconAsset, {
      icon: { 16: appShared.Ix, 20: appShared.Lx },
    }),
  };
}

/** Framer Motion 高度自动展开容器（原 `H`）。 */
function renderSidebarPanelDisclosure(children: unknown, open: boolean): unknown {
  initializeSidebarPanelDisclosure();
  return (jsx as JsxRuntime).jsx(appInitial.Urt, {
    className: "pointer-events-auto",
    height: "content",
    open,
    children,
  });
}

function initializeSidebarPanelDisclosure(): void {
  callInitializer(appInitial, "Rrt");
  jsx ??= callInitializer(appShared, "I3") as JsxRuntime;
}

export {
  SidebarPanelDictationController as a,
  sidebarPanelAttachmentIcons as i,
  renderSidebarPanelDisclosure as n,
  initializeSidebarPanelDictation as o,
  initializeSidebarPanelAttachmentIcons as r,
  initializeSidebarPanelDisclosure as t,
};
