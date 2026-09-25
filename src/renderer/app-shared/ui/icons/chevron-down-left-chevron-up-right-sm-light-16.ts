// 图标资产：chevron-down-left-chevron-up-right-sm-light-16
//（原 app-shared 内部压缩名 twt，懒初始化器 nwt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_chevron_down_left_chevron_up_right_sm_light_16 = createIconPreset({
      name: `chevron-down-left-chevron-up-right-sm-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 3.459961, y: 3.500977, width: 9.080078, height: 8.998047 },
        visualBounds: { x: 3.459961, y: 3.500977, width: 9.080078, height: 8.998047 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.459961, y: 3.500977, width: 9.080078, height: 8.998047 },
        center: { x: 8, y: 8 },
        insets: { top: 3.500977, right: 3.459961, bottom: 3.500976, left: 3.459961 },
        anchors: { frame: { x: 8, y: 8 }, ink: { x: 8, y: 8 }, foreground: { x: 8, y: 8 } }
      },
      capabilities: [`icon`],
      body: `<path d="M6.75391 8.48828C7.18193 8.48828 7.5293 8.83565 7.5293 9.26367V11.9736C7.5293 12.2636 7.29386 12.499 7.00391 12.499C6.71396 12.499 6.47852 12.2636 6.47852 11.9736V9.53906H3.98535C3.6954 9.53906 3.45996 9.30362 3.45996 9.01367C3.45996 8.72372 3.6954 8.48828 3.98535 8.48828H6.75391Z" fill="currentColor"/> <path d="M8.99609 3.50098C9.28604 3.50098 9.52148 3.73642 9.52148 4.02637V6.46094H12.0146C12.3046 6.46094 12.54 6.69638 12.54 6.98633C12.54 7.27628 12.3046 7.51172 12.0146 7.51172H9.24609C8.81807 7.51172 8.4707 7.16435 8.4707 6.73633V4.02637C8.4707 3.73642 8.70614 3.50098 8.99609 3.50098Z" fill="currentColor"/>`
    });
