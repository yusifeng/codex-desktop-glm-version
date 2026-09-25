// 图标资产：arrow-left-lg-bold-16
//（原 app-shared 内部压缩名 Igt，懒初始化器 Lgt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_left_lg_bold_16 = createIconPreset({
      name: `arrow-left-lg-bold-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.904785, y: 2.433594, width: 12.328125, height: 11.133301 },
        visualBounds: { x: 1.904785, y: 2.433594, width: 12.328125, height: 11.133301 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.904785, y: 2.433594, width: 12.328125, height: 11.133301 },
        center: { x: 8.068848, y: 8.000244 },
        insets: { top: 2.433594, right: 1.76709, bottom: 2.433105, left: 1.904785 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8.068848, y: 8.000244 },
          foreground: { x: 8.068848, y: 8.000244 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M6.69686 2.69712C7.04828 2.3457 7.61784 2.34581 7.96932 2.69712C8.3208 3.04859 8.3208 3.6181 7.96932 3.96958L4.84042 7.09946H13.3336C13.8305 7.09963 14.233 7.50291 14.233 7.99985C14.233 8.4968 13.8305 8.90006 13.3336 8.90024H4.83846L7.96932 12.0301C8.3208 12.3816 8.3208 12.9521 7.96932 13.3036C7.61787 13.6545 7.04819 13.6547 6.69686 13.3036L2.2662 8.87192L2.18124 8.77817C1.8127 8.32606 1.81257 7.67357 2.18124 7.22153L2.2662 7.12778L6.69686 2.69712Z" fill="currentColor"/>`
    });
