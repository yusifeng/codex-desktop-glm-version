// DMG 安装器窗口的内嵌 HTML（原 bootstrap-C4dRql4x.ts 24511-24585 行的 `cA`）。
//
// 纯静态模板字符串：data: URL 加载到安装窗口（applications-installer 的
// `Kk`），通过 `window.setInstallerStatus(<json>)` 驱动四种状态文案
// （installing / failed / openFailed / opening）。浅色/深色自适应，
// 进度条为无限循环动画（无真实进度值）。

/** 安装器窗口的状态（与渲染脚本里的 statuses 表对应）。 */
export type InstallerStatus = `installing` | `failed` | `openFailed` | `opening`;

/**
 * 生成安装器窗口的完整 HTML 文档（原 `cA`）。
 * `appName` 会被 JSON 序列化内嵌进渲染脚本。
 */
export function installerWindowHtml(appName: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    :root {
      color-scheme: light dark;
      --accent: #0a84ff;
      --background: #f5f5f7;
      --foreground: #1d1d1f;
      --muted: #6e6e73;
      --track: rgba(0, 0, 0, 0.12);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --background: #1e1e1e;
        --foreground: #f5f5f7;
        --muted: #a1a1a6;
        --track: rgba(255, 255, 255, 0.18);
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: var(--background);
      color: var(--foreground);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    }

    main {
      width: 100%;
      padding: 28px 32px;
    }

    h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 0;
    }

    p {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .progress {
      margin-top: 22px;
      height: 4px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--track);
    }

    .progress::before {
      content: "";
      display: block;
      width: 45%;
      height: 100%;
      border-radius: inherit;
      background: var(--accent);
      animation: progress 1.1s linear infinite;
    }

    body[data-status="failed"] .progress {
      display: none;
    }

    @keyframes progress {
      0% {
        transform: translateX(-110%);
      }
      100% {
        transform: translateX(245%);
      }
    }
  </style>
</head>
<body data-status="installing">
  <main>
    <div id="installer-status" role="status" aria-live="polite" aria-atomic="true">
      <h1 id="title"></h1>
      <p id="detail"></p>
    </div>
    <div class="progress" role="progressbar" aria-label="Installation progress"></div>
  </main>
  <script>
    const appName = ${JSON.stringify(appName)};
    const statuses = {
      installing: {
        title: "Installing " + appName,
        detail: "Moving " + appName + " to Applications…"
      },
      failed: {
        title: "Couldn't install " + appName,
        detail: "Close this window and double-click " + appName + " again to retry, or drag it to Applications if the move keeps failing"
      },
      openFailed: {
        title: appName + " is installed",
        detail: "Open " + appName + " from the Applications folder to finish setup"
      },
      opening: {
        title: "Opening " + appName,
        detail: "Launching " + appName + " from Applications…"
      }
    };

    window.setInstallerStatus = (status) => {
      const nextStatus = statuses[status] ?? statuses.failed;
      const liveRegion = document.getElementById("installer-status");
      const isFailure = status === "failed" || status === "openFailed";
      liveRegion.setAttribute("role", isFailure ? "alert" : "status");
      liveRegion.setAttribute("aria-live", isFailure ? "assertive" : "polite");
      document.body.dataset.status = status;
      document.getElementById("title").textContent = nextStatus.title;
      document.getElementById("detail").textContent = nextStatus.detail;
    };

    window.addEventListener("load", () => {
      window.requestAnimationFrame(() => window.setInstallerStatus("installing"));
    });
  <\/script>
</body>
</html>`;
}
