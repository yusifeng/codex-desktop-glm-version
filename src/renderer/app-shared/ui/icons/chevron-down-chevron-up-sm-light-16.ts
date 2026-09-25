// 图标资产：chevron-down-chevron-up-sm-light-16
//（原 app-shared 内部压缩名 pwt，懒初始化器 mwt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_down_chevron_up_sm_light_16 = createIconPreset({
      name: `chevron-down-chevron-up-sm-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 5, y: 4, width: 6.364014, height: 8.327148 },
        visualBounds: { x: 5, y: 4, width: 6.364014, height: 8.327148 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 5, y: 4, width: 6.364014, height: 8.327148 },
        center: { x: 8.182007, y: 8.163574 },
        insets: { top: 4, right: 4.635986, bottom: 3.672852, left: 5 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 8.182007, y: 8.163574 },
          foreground: { x: 8.182007, y: 8.163574 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M7.75987 9.13777C7.99632 8.92429 8.35344 8.92358 8.59092 9.13582L8.59288 9.13386L11.1847 11.3975C11.403 11.5882 11.4251 11.9194 11.2345 12.1378C11.0438 12.356 10.7126 12.379 10.4942 12.1885L8.17784 10.1651L5.8712 12.1964C5.65366 12.3878 5.32258 12.3669 5.13096 12.1495C4.93951 11.9319 4.96036 11.5999 5.17784 11.4083L7.75889 9.13582L7.75987 9.13777Z" fill="currentColor"/> <path d="M5.13096 4.17781C5.32258 3.96043 5.65366 3.93947 5.8712 4.13093L8.17784 6.16218L10.4942 4.13875C10.7126 3.94829 11.0438 3.97129 11.2345 4.18953C11.4251 4.40791 11.403 4.73905 11.1847 4.92976L8.59288 7.19343L8.59092 7.19148C8.35344 7.40369 7.99631 7.403 7.75987 7.18953L7.75889 7.19148L5.17784 4.91902C4.96035 4.72744 4.93953 4.3954 5.13096 4.17781Z" fill="currentColor"/>`
    });
