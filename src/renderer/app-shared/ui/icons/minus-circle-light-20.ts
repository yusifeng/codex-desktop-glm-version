// 图标资产：minus-circle-light-20
//（原 app-shared 内部压缩名 FDt，懒初始化器 IDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_minus_circle_light_20 = createIconPreset({
      name: `minus-circle-light-20`,
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
      body: `<path d="M13.0879 9.34375C13.4551 9.34379 13.7529 9.64155 13.7529 10.0088C13.7529 10.376 13.4551 10.6738 13.0879 10.6738H6.87793C6.51066 10.6738 6.21289 10.3761 6.21289 10.0088C6.21289 9.64152 6.51066 9.34375 6.87793 9.34375H13.0879Z" fill="currentColor"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M10 1.83496C14.5094 1.83496 18.165 5.49059 18.165 10C18.165 14.5094 14.5094 18.165 10 18.165C5.49059 18.165 1.83496 14.5094 1.83496 10C1.83496 5.49059 5.49059 1.83496 10 1.83496ZM10 3.16504C6.22513 3.16504 3.16504 6.22513 3.16504 10C3.16504 13.7749 6.22513 16.835 10 16.835C13.7749 16.835 16.835 13.7749 16.835 10C16.835 6.22513 13.7749 3.16504 10 3.16504Z" fill="currentColor"/>`
    });
