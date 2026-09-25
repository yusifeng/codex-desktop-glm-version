// 图标资产：square-light-20
//（原 app-shared 内部压缩名 hmt，懒初始化器 gmt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_square_light_20 = createIconPreset({
      name: `square-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 2.334961, y: 2.334961, width: 15.330078, height: 15.330078 },
        visualBounds: { x: 2.334961, y: 2.334961, width: 15.330078, height: 15.330078 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.334961, y: 2.334961, width: 15.330078, height: 15.330078 },
        center: { x: 10, y: 10 },
        insets: { top: 2.334961, right: 2.334961, bottom: 2.334961, left: 2.334961 },
        anchors: { frame: { x: 10, y: 10 }, ink: { x: 10, y: 10 }, foreground: { x: 10, y: 10 } }
      },
      capabilities: [`icon`],
      body: `<path d="M16.335 5.4502C16.335 4.46437 15.5356 3.66504 14.5498 3.66504H5.4502C4.46437 3.66504 3.66504 4.46437 3.66504 5.4502V14.5498C3.66504 15.5356 4.46437 16.335 5.4502 16.335H14.5498C15.5356 16.335 16.335 15.5356 16.335 14.5498V5.4502ZM17.665 14.5498C17.665 16.2702 16.2702 17.665 14.5498 17.665H5.4502C3.72983 17.665 2.33496 16.2702 2.33496 14.5498V5.4502C2.33496 3.72983 3.72983 2.33496 5.4502 2.33496H14.5498C16.2702 2.33496 17.665 3.72983 17.665 5.4502V14.5498Z" fill="currentColor"/>`
    });
