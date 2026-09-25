// avatar overlay 渲染消息分派：renderer 消息 → overlay 管理器方法调用。
//
// 对应 main-C-Mhak1n.ts 98,016-98,084：
//   - GBe：消息类型判定（avatar-overlay- 前缀）
//   - tU：指针屏幕坐标提取（pointerScreenX/Y 缺失时回退窗口坐标）
//   - KBe：13 种消息分派（close/hide/open/open-state-request/drag-start/
//     drag-move/drag-end/drag-release/element-size-changed/pointer-interaction/
//     keyboard-interaction）
//
// 模块加载期副作用：无。

/** overlay 管理器面（结构化子集；实现见 avatar-overlay/composition-surface）。 */
export interface AvatarOverlayManagerLike {
  dismiss(): void;
  hide(): void;
  toggle(origin: unknown): Promise<void>;
  isOpen(): boolean;
  startDrag(viewId: number, pointer: { pointerWindowX: number; pointerWindowY: number; pointerScreenX?: number; pointerScreenY?: number }, usesOrbPhysics?: boolean): void;
  moveDrag(viewId: number, pointer?: { pointerScreenX: number; pointerScreenY: number }): void;
  endDrag(viewId: number, pointer?: { pointerScreenX: number; pointerScreenY: number }, altKey?: boolean): void;
  throwWithVelocity(viewId: number, velocityX: number, velocityY: number, shouldBounce: boolean): void;
  setElementSize(viewId: number, state: Record<string, unknown>): void;
  setPointerInteraction(viewId: number, isInteractive: boolean): void;
  setKeyboardInteraction(viewId: number, isInteractive: boolean, restorePreviousFocus: boolean): void;
}

/** overlay 消息（结构化子集）。 */
export interface AvatarOverlayMessage {
  type: string;
  pointerWindowX?: number;
  pointerWindowY?: number;
  pointerScreenX?: number;
  pointerScreenY?: number;
  usesOrbPhysics?: boolean;
  velocityX?: number;
  velocityY?: number;
  shouldBounce?: boolean;
  altKey?: boolean;
  isInteractive?: boolean;
  restorePreviousFocus?: boolean;
  quickChatFocusRequestId?: unknown;
  isGlobalRealtimeVoiceTransitioning?: unknown;
  isQuickChatLoading?: unknown;
  isTrayVisible?: unknown;
  mascot?: unknown;
  petControlsAppearance?: unknown;
  presentation?: unknown;
  quickChat?: unknown;
  realtimeCaptionAboveMascotPx?: unknown;
  showsPetControls?: unknown;
  tray?: unknown;
}

/** overlay 消息判定（原 `GBe`）。 */
export function isAvatarOverlayMessage(message: { type: string }): boolean {
  return message.type.startsWith("avatar-overlay-");
}

/** 指针屏幕坐标提取（原 `tU`）：非数值时返回 null（回退窗口坐标）。 */
function pointerScreenPosition(message: AvatarOverlayMessage): { pointerScreenX: number; pointerScreenY: number } | null {
  const screenX = "pointerScreenX" in message ? message.pointerScreenX : undefined;
  const screenY = "pointerScreenY" in message ? message.pointerScreenY : undefined;
  return typeof screenX !== "number" || typeof screenY !== "number" ? null : { pointerScreenX: screenX, pointerScreenY: screenY };
}

/**
 * overlay 消息分派（原 `KBe`）：
 * open-state-request 通过 reply 回执 open-state-changed；drag 系消息优先取
 * 屏幕坐标，缺失时回退窗口坐标。
 */
export async function dispatchAvatarOverlayMessage(
  manager: AvatarOverlayManagerLike,
  view: { id: number },
  message: AvatarOverlayMessage,
  reply: (message: Record<string, unknown>) => void = () => {},
): Promise<void> {
  switch (message.type) {
    case "avatar-overlay-close":
      manager.dismiss();
      return;
    case "avatar-overlay-hide":
      manager.hide();
      return;
    case "avatar-overlay-open":
      await manager.toggle(view);
      return;
    case "avatar-overlay-open-state-request":
      reply({ type: "avatar-overlay-open-state-changed", isOpen: manager.isOpen() });
      return;
    case "avatar-overlay-drag-start": {
      const pointer = pointerScreenPosition(message);
      const dragPointer =
        pointer == null
          ? { pointerWindowX: message.pointerWindowX ?? 0, pointerWindowY: message.pointerWindowY ?? 0 }
          : { ...pointer, pointerWindowX: message.pointerWindowX ?? 0, pointerWindowY: message.pointerWindowY ?? 0 };
      manager.startDrag(view.id, dragPointer, message.usesOrbPhysics);
      return;
    }
    case "avatar-overlay-drag-move": {
      const pointer = pointerScreenPosition(message);
      if (pointer) manager.moveDrag(view.id, pointer);
      else manager.moveDrag(view.id);
      return;
    }
    case "avatar-overlay-drag-end": {
      const pointer = pointerScreenPosition(message);
      manager.endDrag(view.id, pointer ?? undefined, message.altKey);
      return;
    }
    case "avatar-overlay-drag-release":
      manager.throwWithVelocity(view.id, message.velocityX ?? 0, message.velocityY ?? 0, !!message.shouldBounce);
      return;
    case "avatar-overlay-element-size-changed":
      manager.setElementSize(view.id, {
        quickChatFocusRequestId: message.quickChatFocusRequestId,
        isGlobalRealtimeVoiceTransitioning: message.isGlobalRealtimeVoiceTransitioning,
        isQuickChatLoading: message.isQuickChatLoading,
        isTrayVisible: message.isTrayVisible,
        mascot: message.mascot,
        petControlsAppearance: message.petControlsAppearance,
        presentation: message.presentation,
        quickChat: message.quickChat,
        realtimeCaptionAboveMascotPx: message.realtimeCaptionAboveMascotPx,
        showsPetControls: message.showsPetControls,
        tray: message.tray,
      });
      return;
    case "avatar-overlay-pointer-interaction-changed":
      manager.setPointerInteraction(view.id, !!message.isInteractive);
      return;
    case "avatar-overlay-keyboard-interaction-changed":
      manager.setKeyboardInteraction(view.id, !!message.isInteractive, !!message.restorePreviousFocus);
      return;
  }
}
