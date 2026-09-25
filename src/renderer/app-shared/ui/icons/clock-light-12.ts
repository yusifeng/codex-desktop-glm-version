// 图标资产：clock-light-12
//（原 app-shared 内部压缩名 tDt，懒初始化器 nDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_clock_light_12 = createIconPreset({
      name: `clock-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 1.100098, y: 1.100098, width: 9.800781, height: 9.800781 },
        visualBounds: { x: 1.100098, y: 1.100098, width: 9.800781, height: 9.800781 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `circular`,
        bounds: { x: 1.100098, y: 1.100098, width: 9.800781, height: 9.800781 },
        center: { x: 6.000489, y: 6.000489 },
        insets: { top: 1.100098, right: 1.099121, bottom: 1.099121, left: 1.100098 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6.000489, y: 6.000489 },
          foreground: { x: 6.000489, y: 6.000489 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M6.00037 3.1001C6.22127 3.10011 6.40076 3.27958 6.40076 3.50049V5.89697C6.40075 6.06934 6.33221 6.23505 6.21033 6.35693L5.03357 7.53369C4.87736 7.6899 4.62337 7.68989 4.46716 7.53369C4.31095 7.37748 4.31095 7.1235 4.46716 6.96729L5.59998 5.83447V3.50049C5.59998 3.27957 5.77945 3.1001 6.00037 3.1001Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M6.00037 1.1001C8.70656 1.1001 10.9008 3.29429 10.9008 6.00049C10.9008 8.70668 8.70656 10.9009 6.00037 10.9009C3.29417 10.9009 1.09998 8.70668 1.09998 6.00049C1.09998 3.29429 3.29417 1.1001 6.00037 1.1001ZM6.00037 1.90088C3.736 1.90088 1.90076 3.73612 1.90076 6.00049C1.90076 8.26486 3.736 10.1001 6.00037 10.1001C8.26473 10.1001 10.1 8.26486 10.1 6.00049C10.1 3.73612 8.26473 1.90088 6.00037 1.90088Z" fill="currentColor"/>`
    });
