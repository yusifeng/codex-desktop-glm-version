// 图标资产：minus-square-light-16
//（原 app-shared 内部压缩名 d2e，懒初始化器 f2e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_minus_square_light_16 = createIconPreset({
      name: `minus-square-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.807983, y: 1.808105, width: 12.383789, height: 12.383789 },
        visualBounds: { x: 1.807983, y: 1.808105, width: 12.383789, height: 12.383789 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.807983, y: 1.808105, width: 12.383789, height: 12.383789 },
        center: { x: 7.999878, y: 8 },
        insets: { top: 1.808105, right: 1.808228, bottom: 1.808106, left: 1.807983 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.999878, y: 8 },
          foreground: { x: 7.999878, y: 8 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M10.5834 7.4751C10.8732 7.47527 11.1078 7.71065 11.1078 8.00049C11.1075 8.29011 10.873 8.5257 10.5834 8.52588H5.41638C5.12676 8.52568 4.89126 8.29009 4.89099 8.00049C4.89099 7.71066 5.1266 7.4753 5.41638 7.4751H10.5834Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.683 1.80811C13.0683 1.80811 14.1918 2.93158 14.1918 4.31689V11.6831C14.1918 13.0684 13.0683 14.1919 11.683 14.1919H4.31677C2.93146 14.1919 1.80798 13.0684 1.80798 11.6831V4.31689C1.80798 2.93158 2.93146 1.80811 4.31677 1.80811H11.683ZM4.31677 2.85889C3.51136 2.85889 2.85876 3.51148 2.85876 4.31689V11.6831C2.85876 12.4885 3.51136 13.1421 4.31677 13.1421H11.683C12.4884 13.1421 13.142 12.4885 13.142 11.6831V4.31689C13.142 3.51148 12.4884 2.85889 11.683 2.85889H4.31677Z" fill="currentColor"/>`
    });
