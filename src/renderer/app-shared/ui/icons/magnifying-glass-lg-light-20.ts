// 图标资产：magnifying-glass-lg-light-20
//（原 app-shared 内部压缩名 s2e，懒初始化器 c2e；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_magnifying_glass_lg_light_20 = createIconPreset({
      name: `magnifying-glass-lg-light-20`,
      canvas: {
        width: 20,
        height: 20,
        viewBox: `0 0 20 20`,
        frame: { x: 0, y: 0, width: 20, height: 20 },
        inkBounds: { x: 2.454262, y: 2.378906, width: 15.30024, height: 15.371094 },
        visualBounds: { x: 2.454262, y: 2.378906, width: 15.30024, height: 15.371094 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.454262, y: 2.378906, width: 15.30024, height: 15.371094 },
        center: { x: 10.104382, y: 10.064453 },
        insets: { top: 2.378906, right: 2.245498, bottom: 2.25, left: 2.454262 },
        anchors: {
          frame: { x: 10, y: 10 },
          ink: { x: 10.104382, y: 10.064453 },
          foreground: { x: 10.104382, y: 10.064453 }
        }
      },
      capabilities: [`icon`],
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.16125 2.37891C12.8651 2.37908 15.8673 5.38206 15.8673 9.08594C15.8672 10.7162 15.2847 12.2098 14.3175 13.3721L17.5597 16.6152C17.8194 16.8749 17.8194 17.296 17.5597 17.5557C17.3 17.8152 16.8789 17.8153 16.6193 17.5557L13.3683 14.3057C12.2176 15.2343 10.7551 15.7919 9.16125 15.792C5.45737 15.792 2.4544 12.7898 2.45422 9.08594C2.45422 5.38195 5.45727 2.37891 9.16125 2.37891ZM9.16125 3.70898C6.1918 3.70898 3.7843 6.11649 3.7843 9.08594C3.78448 12.0552 6.19191 14.4619 9.16125 14.4619C12.1304 14.4617 14.5371 12.0551 14.5372 9.08594C14.5372 6.1166 12.1306 3.70916 9.16125 3.70898Z" fill="currentColor"/>`
    });
