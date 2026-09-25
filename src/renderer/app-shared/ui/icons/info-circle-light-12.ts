// 图标资产：info-circle-light-12
//（原 app-shared 内部压缩名 wxt，懒初始化器 Txt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_info_circle_light_12 = createIconPreset({
      name: `info-circle-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 1.019531, y: 1.019531, width: 9.960938, height: 9.960938 },
        visualBounds: { x: 1.019531, y: 1.019531, width: 9.960938, height: 9.960938 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `circular`,
        bounds: { x: 1.019531, y: 1.019531, width: 9.960938, height: 9.960938 },
        center: { x: 6, y: 6 },
        insets: { top: 1.019531, right: 1.019531, bottom: 1.019531, left: 1.019531 },
        anchors: { frame: { x: 6, y: 6 }, ink: { x: 6, y: 6 }, foreground: { x: 6, y: 6 } }
      },
      capabilities: [`icon`],
      body: `<path d="M6 5.51953C6.2651 5.51953 6.48047 5.7349 6.48047 6V8C6.48047 8.2651 6.2651 8.48047 6 8.48047C5.7349 8.48047 5.51953 8.2651 5.51953 8V6C5.51953 5.7349 5.7349 5.51953 6 5.51953Z" fill="currentColor"/> <path d="M6.12305 3.58789C6.40097 3.64481 6.61035 3.8908 6.61035 4.18555C6.61035 4.52244 6.33689 4.7959 6 4.7959C5.70525 4.7959 5.45926 4.58651 5.40234 4.30859L5.38965 4.18555L5.40234 4.0625C5.45926 3.78458 5.70525 3.5752 6 3.5752L6.12305 3.58789Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M6 1.01953C8.75038 1.01953 10.9805 3.24962 10.9805 6C10.9805 8.75038 8.75038 10.9805 6 10.9805C3.24962 10.9805 1.01953 8.75038 1.01953 6C1.01953 3.24962 3.24962 1.01953 6 1.01953ZM6 1.98047C3.77982 1.98047 1.98047 3.77982 1.98047 6C1.98047 8.22018 3.77982 10.0195 6 10.0195C8.22018 10.0195 10.0195 8.22018 10.0195 6C10.0195 3.77982 8.22018 1.98047 6 1.98047Z" fill="currentColor"/>`
    });
