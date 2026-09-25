// 图标资产：circle-xmark-light-20
//（原 app-shared 内部压缩名 pbt，懒初始化器 mbt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_circle_xmark_light_20 = createIconPreset({
      name: `circle-xmark-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 1.834961, y: 1.834961, width: 16.330078, height: 16.330078 },
        visualBounds: { x: 1.834961, y: 1.834961, width: 16.330078, height: 16.330078 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `circular`,
        bounds: { x: 1.834961, y: 1.834961, width: 16.330078, height: 16.330078 },
        center: { x: 10, y: 10 },
        insets: { top: 1.834961, right: 1.834961, bottom: 1.834961, left: 1.834961 },
        anchors: { frame: { x: 10, y: 10 }, ink: { x: 10, y: 10 }, foreground: { x: 10, y: 10 } }
      },
      capabilities: [`icon`],
      body: `<path d="M11.9453 7.11426C12.205 6.85456 12.627 6.85456 12.8867 7.11426C13.146 7.37398 13.1462 7.79514 12.8867 8.05469L10.9404 10L12.8857 11.9453C13.1454 12.205 13.1454 12.626 12.8857 12.8857C12.626 13.1454 12.205 13.1454 11.9453 12.8857L10 10.9404L8.05469 12.8857C7.79499 13.1454 7.37396 13.1454 7.11426 12.8857C6.8546 12.626 6.85457 12.205 7.11426 11.9453L9.05957 10L7.11426 8.05469C6.85456 7.79499 6.85456 7.37298 7.11426 7.11328C7.37398 6.85404 7.79514 6.85377 8.05469 7.11328L10 9.05859L11.9453 7.11426Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 1.83496C14.5094 1.83496 18.165 5.49059 18.165 10C18.165 14.5094 14.5094 18.165 10 18.165C5.49059 18.165 1.83496 14.5094 1.83496 10C1.83496 5.49059 5.49059 1.83496 10 1.83496ZM10 3.16504C6.22513 3.16504 3.16504 6.22513 3.16504 10C3.16504 13.7749 6.22513 16.835 10 16.835C13.7749 16.835 16.835 13.7749 16.835 10C16.835 6.22513 13.7749 3.16504 10 3.16504Z" fill="currentColor"/>`
    });
