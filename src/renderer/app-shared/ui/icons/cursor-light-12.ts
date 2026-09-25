// 图标资产：cursor-light-12
//（原 app-shared 内部压缩名 NCt，懒初始化器 PCt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_cursor_light_12 = createIconPreset({
      name: `cursor-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 0.933044, y: 0.959473, width: 10.106628, height: 10.138672 },
        visualBounds: { x: 0.933044, y: 0.959473, width: 10.106628, height: 10.138672 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 0.933044, y: 0.959473, width: 10.106628, height: 10.138672 },
        center: { x: 5.986358, y: 6.028809 },
        insets: { top: 0.959473, right: 0.960328, bottom: 0.901855, left: 0.933044 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 5.986358, y: 6.028809 },
          foreground: { x: 5.986358, y: 6.028809 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M2.53029 1.02844C1.59298 0.701962 0.686658 1.58962 0.994158 2.53332L3.51564 10.2697C3.84807 11.2899 5.24965 11.3944 5.72951 10.4347L7.23049 7.43371C7.27167 7.35144 7.33996 7.28597 7.42385 7.24817L10.332 5.93957C11.3215 5.49433 11.259 4.06892 10.2344 3.71204L2.53029 1.02844ZM1.7549 2.28528C1.6525 1.97089 1.95437 1.67498 2.26662 1.78332L9.9717 4.46692C10.3132 4.58593 10.3337 5.06168 10.0039 5.21008L7.09572 6.51868C6.84368 6.63211 6.63827 6.82908 6.51467 7.07629L5.01467 10.0773C4.85478 10.397 4.38745 10.3622 4.27639 10.0226L1.7549 2.28528Z" fill="currentColor"/>`
    });
