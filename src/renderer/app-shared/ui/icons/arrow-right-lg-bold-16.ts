// 图标资产：arrow-right-lg-bold-16
//（原 app-shared 内部压缩名 Rgt，懒初始化器 zgt；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const icon_arrow_right_lg_bold_16 = createIconPreset({
      name: `arrow-right-lg-bold-16`,
      canvas: {
        width: 16,
        height: 16,
        viewBox: `0 0 16 16`,
        frame: { x: 0, y: 0, width: 16, height: 16 },
        inkBounds: { x: 1.76709, y: 2.433594, width: 12.328125, height: 11.133301 },
        visualBounds: { x: 1.76709, y: 2.433594, width: 12.328125, height: 11.133301 }
      },
      paint: { kind: `monochrome` },
      optical: {
        shape: `non-circular`,
        bounds: { x: 1.76709, y: 2.433594, width: 12.328125, height: 11.133301 },
        center: { x: 7.931153, y: 8.000244 },
        insets: { top: 2.433594, right: 1.904785, bottom: 2.433105, left: 1.76709 },
        anchors: {
          frame: { x: 8, y: 8 },
          ink: { x: 7.931153, y: 8.000244 },
          foreground: { x: 7.931153, y: 8.000244 }
        }
      },
      capabilities: [`icon`],
      body: `<path d="M8.03076 2.69712C8.38225 2.34581 8.95181 2.3457 9.30322 2.69712L13.7339 7.12778L13.8188 7.22153C14.1876 7.67357 14.1874 8.32605 13.8188 8.77817L13.7339 8.87192L9.30322 13.3036C8.95187 13.6547 8.38219 13.6545 8.03076 13.3036C7.67931 12.9521 7.67935 12.3816 8.03076 12.0301L11.1616 8.90024H2.6665C2.1696 8.90007 1.76709 8.4968 1.76709 7.99985C1.7671 7.50291 2.16961 7.09964 2.6665 7.09946H11.1597L8.03076 3.96958C7.67931 3.61813 7.67935 3.04859 8.03076 2.69712Z" fill="currentColor"/>`
    });
