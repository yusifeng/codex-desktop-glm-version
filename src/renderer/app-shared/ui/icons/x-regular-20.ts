// 图标资产：x-regular-20
//（原 app-shared 内部压缩名 t8e，懒初始化器 n8e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_x_regular_20 = createIconPreset({
      name: `x-regular-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 1.578613, y: 2.083252, width: 16.722656, height: 15.833252 },
        visualBounds: { x: 1.578613, y: 2.083252, width: 16.722656, height: 15.833252 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.578613, y: 2.083252, width: 16.722656, height: 15.833252 },
        center: { x: 9.939941, y: 9.999878 },
        insets: { top: 2.083252, right: 1.698731, bottom: 2.083496, left: 1.578613 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 9.939941, y: 9.999878 },
          foreground: { x: 9.939941, y: 9.999878 }
        }
      },
      capabilities: [`icon`],
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.8755 7.34204L15.4995 2.08325H17.932L11.9562 8.87931L18.3014 17.9166H12.8164L8.90609 12.3486L4.01188 17.9166H1.57861L7.82617 10.8105L1.69824 2.08325H7.18327L10.8755 7.34204ZM13.8703 16.1531H14.8786L6.11881 3.89152H5.11051L13.8703 16.1531Z" fill="currentColor"/>`
    });
