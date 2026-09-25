// 图标资产：video-fill-light-12
//（原 app-shared 内部压缩名 dlt，懒初始化器 flt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_video_fill_light_12 = createIconPreset({
      name: `video-fill-light-12`,
      canvas: {
        width: 12,
        height: 12,
        viewBox: `0 0 12 12`,
        frame: { x: 0, y: 0, width: 12, height: 12 },
        inkBounds: { x: 1.099609, y: 2.349609, width: 10.34668, height: 7.300781 },
        visualBounds: { x: 1.099609, y: 2.349609, width: 10.34668, height: 7.300781 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.099609, y: 2.349609, width: 10.34668, height: 7.300781 },
        center: { x: 6.272949, y: 5.999999 },
        insets: { top: 2.349609, right: 0.553711, bottom: 2.34961, left: 1.099609 },
        anchors: {
          frame: { x: 6, y: 6 },
          ink: { x: 6.272949, y: 5.999999 },
          foreground: { x: 6.272949, y: 5.999999 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M6.09961 2.34961C7.09372 2.34961 7.90039 3.15628 7.90039 4.15039V7.84961C7.90039 8.84372 7.09372 9.65039 6.09961 9.65039H2.90039C1.90628 9.65039 1.09961 8.84372 1.09961 7.84961V4.15039C1.09961 3.15628 1.90628 2.34961 2.90039 2.34961H6.09961Z" fill="currentColor"/> <path d="M10.1738 3.39258C10.7021 3.00664 11.4457 3.38382 11.4463 4.03809V7.96094C11.4463 8.6159 10.7023 8.99329 10.1738 8.60645L10.1602 8.59668L8.95605 7.63379C8.86006 7.55698 8.80379 7.44031 8.80371 7.31738V4.73926C8.80383 4.62034 8.85651 4.50655 8.94727 4.42969L10.1514 3.41016L10.1621 3.40137L10.1738 3.39258Z" fill="currentColor"/>`
    });
