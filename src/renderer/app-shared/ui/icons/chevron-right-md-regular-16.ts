// 图标资产：chevron-right-md-regular-16
//（原 app-shared 内部压缩名 sDt，懒初始化器 cDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_md_regular_16 = createIconPreset({
      name: `chevron-right-md-regular-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 5.583496, y: 3.25, width: 5.361816, height: 9.5 },
        visualBounds: { x: 5.583496, y: 3.25, width: 5.361816, height: 9.5 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5.583496, y: 3.25, width: 5.361816, height: 9.5 },
        center: { x: 8.264404, y: 8 },
        insets: { top: 3.25, right: 5.054688, bottom: 3.25, left: 5.583496 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8.264404, y: 8 },
          foreground: { x: 8.264404, y: 8 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M5.80317 11.4697C5.51027 11.7626 5.51027 12.2373 5.80317 12.5302C6.09606 12.8231 6.57082 12.8231 6.86371 12.5302L10.6284 8.76557C11.051 8.34259 11.051 7.6573 10.6284 7.23432L6.86371 3.46967C6.57082 3.17678 6.09606 3.17678 5.80317 3.46967C5.51027 3.76256 5.51027 4.23732 5.80317 4.53022L9.27289 7.99994L5.80317 11.4697Z" fill="currentColor"/>`
    });
