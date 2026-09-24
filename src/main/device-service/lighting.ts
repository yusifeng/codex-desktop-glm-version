// 灯效模型 → 设备灯效配置的纯函数转换。
//
// 两条写入通道：
//   - sendLightingConfig（OAILightingConfig）：键盘背光 + 环境灯两个灯区，
//     由「选中线程状态 + 语音状态 + 选中高亮窗口」推导；
//   - sendThreadsLighting（ThreadLighting[]）：6 个线程槽位各自的
//     颜色/亮度/灯效（选中或 pulsing 的槽位用呼吸灯）。
// 颜色码来自 shared chunk 的 colorForThreadStatus（t.tf）。

import { tf as colorForThreadStatus } from "@chunk/shared";
import { OAILightingEffect } from "./device-kit";
import type {
  LightingConfig,
  LightingModel,
  LightingZoneConfig,
  ThreadLightingConfig,
  ThreadSlot,
  ThreadSlotStatus,
  VoiceState,
} from "./types";

/** 线程槽位数量（AG0..AG5 共 6 个物理键）。 */
export const THREAD_SLOT_COUNT = 6;

/** 呼吸灯速度（选中/pulsing 线程槽位）。 */
const BREATH_SPEED = 0.4;
/** 蛇形灯效速度（working 线程 / 语音录制处理中）。 */
const SNAKE_SPEED = 0.4;

/** 语音录制中的环境灯颜色（0x2E8B57，绿色）。 */
const VOICE_RECORDING_COLOR = 3050327;
/** 语音完成/处理中的环境灯颜色（0xFFFFFF，白色）。 */
const VOICE_COMPLETED_COLOR = 16777215;

/** 全灭配置（连接建立前/断开时/停止时写入设备）。 */
export const LIGHTING_OFF: LightingConfig = {
  keys: { effect: OAILightingEffect.off, brightness: 0, speed: 0, magic: 0, color: 0 },
  ambient: { effect: OAILightingEffect.off, brightness: 0, speed: 0, magic: 0, color: 0 },
};

/** 空灯效模型（6 个全 off 的槽位，语音 idle）。 */
export const EMPTY_LIGHTING_MODEL: LightingModel = {
  brightness: 1,
  inactivityTimeoutMs: null,
  slots: createEmptyThreadSlots(),
  voiceState: "idle",
};

/** 创建 6 个全 off 的空线程槽位。 */
function createEmptyThreadSlots(): ThreadSlot[] {
  return Array.from({ length: THREAD_SLOT_COUNT }, (_unused, id) => ({
    id,
    threadKey: null,
    title: null,
    status: "off",
    selected: false,
  }));
}

/** 语音状态 → 环境灯灯效（idle 返回 null 表示不覆盖线程灯效）。 */
function ambientZoneForVoiceState(voiceState: VoiceState, brightness: number): LightingZoneConfig | null {
  switch (voiceState) {
    case "idle":
      return null;
    case "recording":
    case "processing":
      return {
        effect: OAILightingEffect.snake,
        brightness,
        speed: SNAKE_SPEED,
        magic: 0,
        color: voiceState === "recording" ? VOICE_RECORDING_COLOR : VOICE_COMPLETED_COLOR,
      };
    case "completed":
      return { effect: OAILightingEffect.solid, brightness, speed: 0, magic: 0, color: VOICE_COMPLETED_COLOR };
  }
}

/**
 * 灯效模型 → OAILightingConfig（键盘 + 环境两个灯区）。
 *
 * @param slots                 线程槽位列表
 * @param voiceState            语音会话状态（优先驱动环境灯）
 * @param selectionLightingVisible 选中高亮窗口是否可见（4s 内键盘跟随环境灯颜色）
 * @param brightness            亮度（0–1）
 * @param snakingAmbientStatus  弹出导航打开时的环境灯「蛇形」状态（覆盖一切）
 */
export function lightingConfigForModel(
  slots: ThreadSlot[],
  voiceState: VoiceState,
  selectionLightingVisible: boolean,
  brightness: number,
  snakingAmbientStatus: ThreadSlotStatus | undefined,
): LightingConfig {
  if (snakingAmbientStatus != null) {
    // 弹出导航打开：键盘全灭，环境灯按指定状态蛇形流动。
    return {
      keys: LIGHTING_OFF.keys,
      ambient: { effect: OAILightingEffect.snake, brightness, speed: SNAKE_SPEED, magic: 0, color: colorForThreadStatus(snakingAmbientStatus) },
    };
  }

  const selectedSlot = slots.find((slot) => slot.selected);
  const voiceAmbient = ambientZoneForVoiceState(voiceState, brightness);
  if (selectedSlot == null || selectedSlot.status === "off") {
    // 无有效选中线程：键盘全灭，环境灯只受语音状态驱动。
    return { keys: LIGHTING_OFF.keys, ambient: voiceAmbient ?? LIGHTING_OFF.ambient };
  }

  // 选中线程的灯效：working 蛇形，其余纯色。
  const selectedSlotLighting: LightingZoneConfig = {
    effect: selectedSlot.status === "working" ? OAILightingEffect.snake : OAILightingEffect.solid,
    brightness,
    speed: selectedSlot.status === "working" ? SNAKE_SPEED : 0,
    magic: 0,
    color: colorForThreadStatus(selectedSlot.status),
  };
  const ambient =
    voiceAmbient ??
    (selectedSlot.status === "working" || selectionLightingVisible
      ? selectedSlotLighting
      : LIGHTING_OFF.ambient);
  return {
    // 选中高亮窗口可见时键盘跟随环境灯颜色（纯色）。
    keys: selectionLightingVisible
      ? { effect: OAILightingEffect.solid, brightness, speed: 0, magic: 0, color: ambient.color }
      : LIGHTING_OFF.keys,
    ambient,
  };
}

/**
 * 线程槽位 → ThreadLighting[]（每槽位一条；off 全灭，
 * 选中/pulsing 用呼吸灯，其余纯色）。
 *
 * @param slots      线程槽位列表
 * @param brightness 亮度（0–1）
 */
export function threadLightingForSlots(slots: ThreadSlot[], brightness: number): ThreadLightingConfig[] {
  return slots.map((slot) => {
    if (slot.status === "off") {
      return {
        id: slot.id,
        color: 0,
        brightness: 0,
        effect: OAILightingEffect.off,
        speed: 0,
        syncKeysLighting: false,
        syncAmbientLighting: false,
      };
    }
    const breathing = slot.selected || !!slot.pulsing;
    return {
      id: slot.id,
      color: colorForThreadStatus(slot.status),
      brightness,
      effect: breathing ? OAILightingEffect.breath : OAILightingEffect.solid,
      speed: breathing ? BREATH_SPEED : 0,
      syncKeysLighting: false,
      syncAmbientLighting: false,
    };
  });
}
