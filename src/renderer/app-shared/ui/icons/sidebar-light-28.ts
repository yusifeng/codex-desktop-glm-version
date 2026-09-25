// 图标资产：sidebar-light-28
//（原 app-shared 内部压缩名 TOt，懒初始化器 EOt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_sidebar_light_28 = createIconPreset({
      name: `sidebar-light-28`,
      canvas: {
        width: 28,
        height: 28,
        viewBox: `0 0 28 28`,
        frame: { x: 0, y: 0, width: 28, height: 28 },
        inkBounds: { x: 2.669922, y: 4.128906, width: 22.660156, height: 19.743164 },
        visualBounds: { x: 2.669922, y: 4.128906, width: 22.660156, height: 19.743164 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 2.669922, y: 4.128906, width: 22.660156, height: 19.743164 },
        center: { x: 14, y: 14.000488 },
        insets: { top: 4.128906, right: 2.669922, bottom: 4.12793, left: 2.669922 },
        anchors: {
          frame: { x: 14, y: 14 },
          ink: { x: 14, y: 14.000488 },
          foreground: { x: 14, y: 14.000488 }
        }
      },
      capabilities: [`icon`],
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M20.5 4.12891C23.1675 4.12891 25.3301 6.29145 25.3301 8.95898V19.043C25.3298 21.7103 23.1674 23.8721 20.5 23.8721H7.5C4.83263 23.8721 2.67019 21.7103 2.66992 19.043V8.95898C2.66992 6.29145 4.83246 4.12891 7.5 4.12891H20.5ZM11.3301 22.2129H20.5C22.2506 22.2129 23.6697 20.7935 23.6699 19.043V8.95898C23.6699 7.20824 22.2507 5.78906 20.5 5.78906H11.3301V22.2129ZM7.5 5.78906C5.74926 5.78906 4.33008 7.20824 4.33008 8.95898V19.043C4.33034 20.7935 5.74942 22.2129 7.5 22.2129H9.66992V5.78906H7.5Z" fill="currentColor"/>`
    });
