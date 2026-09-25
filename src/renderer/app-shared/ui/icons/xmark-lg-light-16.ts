// 图标资产：xmark-lg-light-16
//（原 app-shared 内部压缩名 YT，懒初始化器 XT；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_xmark_lg_light_16 = createIconPreset({
      name: `xmark-lg-light-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 3.225128, y: 3.225098, width: 9.5495, height: 9.549561 },
        visualBounds: { x: 3.225128, y: 3.225098, width: 9.5495, height: 9.549561 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 3.225128, y: 3.225098, width: 9.5495, height: 9.549561 },
        center: { x: 7.999878, y: 7.999879 },
        insets: { top: 3.225098, right: 3.225372, bottom: 3.225341, left: 3.225128 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.999878, y: 7.999879 },
          foreground: { x: 7.999878, y: 7.999879 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M11.8786 3.37864C12.0835 3.17377 12.4158 3.17407 12.6208 3.37864C12.8259 3.58367 12.8259 3.9158 12.6208 4.12083L8.74192 7.99974L12.6208 11.8786C12.8259 12.0837 12.8259 12.4158 12.6208 12.6208C12.4158 12.8259 12.0837 12.8259 11.8786 12.6208L7.99974 8.74192L4.12083 12.6208C3.9158 12.8258 3.58366 12.8259 3.37864 12.6208C3.17408 12.4158 3.17378 12.0835 3.37864 11.8786L7.25755 7.99974L3.37864 4.12083C3.17407 3.91577 3.17377 3.58352 3.37864 3.37864C3.58352 3.17377 3.91577 3.17407 4.12083 3.37864L7.99974 7.25755L11.8786 3.37864Z" fill="currentColor"/>`
    });
