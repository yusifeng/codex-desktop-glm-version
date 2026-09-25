// 图标资产：chevron-right-md-light-16
//（原 app-shared 内部压缩名 R1，懒初始化器 z1；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_right_md_light_16 = createIconPreset({
      name: `chevron-right-md-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 5.808594, y: 3.475098, width: 4.911621, height: 9.049805 },
        visualBounds: { x: 5.808594, y: 3.475098, width: 4.911621, height: 9.049805 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5.808594, y: 3.475098, width: 4.911621, height: 9.049805 },
        center: { x: 8.264405, y: 8 },
        insets: { top: 3.475098, right: 5.279785, bottom: 3.475097, left: 5.808594 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8.264405, y: 8 },
          foreground: { x: 8.264405, y: 8 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M5.96236 11.6289C5.75734 11.8339 5.75734 12.166 5.96236 12.3711C6.16739 12.5761 6.49953 12.5761 6.70455 12.3711L10.4692 8.60641C10.8039 8.27129 10.8039 7.72863 10.4692 7.39351L6.70455 3.62887C6.49952 3.42384 6.16739 3.42384 5.96236 3.62887C5.75734 3.83389 5.75734 4.16603 5.96236 4.37105L9.59127 7.99996L5.96236 11.6289Z" fill="currentColor"/>`
    });
