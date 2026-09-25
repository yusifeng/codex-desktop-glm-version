// 图标资产：magnifying-glass-lg-light-32
//（原 app-shared 内部压缩名 xDt，懒初始化器 SDt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_magnifying_glass_lg_light_32 = createIconPreset({
      name: `magnifying-glass-lg-light-32`,
      canvas: {
        width: 32,
        height: 32,
        viewBox: `0 0 32 32`,
        frame: { x: 0, y: 0, width: 32, height: 32 },
        inkBounds: { x: 4.090576, y: 3.970703, width: 24.153152, height: 24.266602 },
        visualBounds: { x: 4.090576, y: 3.970703, width: 24.153152, height: 24.266602 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 4.090576, y: 3.970703, width: 24.153152, height: 24.266602 },
        center: { x: 16.167152, y: 16.104004 },
        insets: { top: 3.970703, right: 3.756272, bottom: 3.762695, left: 4.090576 },
        anchors: {
          frame: { x: 16, y: 16 },
          ink: { x: 16.167152, y: 16.104004 },
          foreground: { x: 16.167152, y: 16.104004 }
        }
      },
      capabilities: [`icon`],
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M14.658 3.9707C20.4936 3.97088 25.2244 8.70239 25.2244 14.5381C25.2243 17.1605 24.266 19.5572 22.6843 21.4043L27.9802 26.7012C28.3315 27.0527 28.3316 27.6222 27.9802 27.9736C27.6288 28.3249 27.0592 28.3249 26.7078 27.9736L21.4031 22.6699C19.573 24.1896 17.2226 25.1044 14.658 25.1045C8.82226 25.1045 4.09075 20.3737 4.09058 14.5381C4.09058 8.70228 8.82215 3.9707 14.658 3.9707ZM14.658 5.77148C9.81626 5.77148 5.89136 9.69639 5.89136 14.5381C5.89153 19.3796 9.81637 23.3047 14.658 23.3047C19.4994 23.3045 23.4244 19.3795 23.4246 14.5381C23.4246 9.6965 19.4995 5.77166 14.658 5.77148Z" fill="currentColor"/>`
    });
