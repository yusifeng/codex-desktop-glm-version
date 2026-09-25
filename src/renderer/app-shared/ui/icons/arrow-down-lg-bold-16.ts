// 图标资产：arrow-down-lg-bold-16
//（原 app-shared 内部压缩名 Pgt，懒初始化器 Fgt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_down_lg_bold_16 = createIconPreset({
      name: `arrow-down-lg-bold-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 2.433105, y: 1.766602, width: 11.133545, height: 12.329102 },
        visualBounds: { x: 2.433105, y: 1.766602, width: 11.133545, height: 12.329102 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.433105, y: 1.766602, width: 11.133545, height: 12.329102 },
        center: { x: 7.999878, y: 7.931153 },
        insets: { top: 1.766602, right: 2.43335, bottom: 1.904296, left: 2.433105 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.999878, y: 7.931153 },
          foreground: { x: 7.999878, y: 7.931153 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.00042 1.7666C8.49731 1.7668 8.90081 2.17006 8.90081 2.66699V11.1592L12.0307 8.03027C12.3821 7.67918 12.9518 7.67907 13.3032 8.03027C13.6546 8.38175 13.6546 8.95226 13.3032 9.30371L8.87249 13.7344C8.39093 14.2159 7.61002 14.2158 7.12835 13.7344L2.69671 9.30371C2.34524 8.95224 2.34524 8.38175 2.69671 8.03027C3.04818 7.6788 3.61867 7.6788 3.97015 8.03027L7.10003 11.1602V2.66699C7.10003 2.16994 7.50336 1.7666 8.00042 1.7666Z" fill="currentColor"/>`
    });
