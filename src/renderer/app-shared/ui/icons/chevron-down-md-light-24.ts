// 图标资产：chevron-down-md-light-24
//（原 app-shared 内部压缩名 aOt，懒初始化器 oOt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_down_md_light_24 = createIconPreset({
      name: `chevron-down-md-light-24`,
      canvas: {
        width: 24,
        height: 24,
        viewBox: `0 0 24 24`,
        frame: { x: 0, y: 0, width: 24, height: 24 },
        inkBounds: { x: 5.25, y: 9.25, width: 13.5, height: 7.292969 },
        visualBounds: { x: 5.25, y: 9.25, width: 13.5, height: 7.292969 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5.25, y: 9.25, width: 13.5, height: 7.292969 },
        center: { x: 12, y: 12.896485 },
        insets: { top: 9.25, right: 5.25, bottom: 7.457031, left: 5.25 },
        anchors: {
          frame: { x: 12, y: 12 },
          ink: { x: 12, y: 12.896485 },
          foreground: { x: 12, y: 12.896485 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M17.4697 9.46967C17.7626 9.17678 18.2373 9.17678 18.5302 9.46967C18.8231 9.76256 18.8231 10.2373 18.5302 10.5302L12.8837 16.1767C12.3956 16.6648 11.6043 16.6648 11.1162 16.1767L5.46967 10.5302C5.17678 10.2373 5.17678 9.76256 5.46967 9.46967C5.76256 9.17678 6.23732 9.17678 6.53022 9.46967L11.9999 14.9394L17.4697 9.46967Z" fill="currentColor"/>`
    });
