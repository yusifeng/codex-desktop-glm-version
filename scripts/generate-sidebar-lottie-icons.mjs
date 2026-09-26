// Sidebar Lottie 动画图标生成器。
//
// 官方 chunk 的唯一业务导出是完整的 Lottie JSON 对象。本脚本直接加载
// 只读原版的 default export，再以稳定 JSON 形式生成语义 TypeScript，
// 避免手工转录动画关键帧造成精度漂移。
//
// 用法：node scripts/generate-sidebar-lottie-icons.mjs [--src-dir <assets>]
// 生成文件勿手改。

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import prettier from "prettier";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sourceIndex = args.indexOf("--src-dir");
const sourceDirectory = path.resolve(
  ROOT,
  sourceIndex === -1
    ? ".reference/app-original/webview/assets"
    : args[sourceIndex + 1],
);

const ICONS = {
  "sidebar-search-icon": "sidebar-search-icon-25c3166a0517.js",
  "sidebar-tasks-icon": "sidebar-tasks-icon-993c7268c532.js",
  "sidebar-more-icon": "sidebar-more-icon-c2842535c912.js",
  "sidebar-library-icon": "sidebar-library-icon-910c558641d3.js",
  "sidebar-finances-icon": "sidebar-finances-icon-aca5eab84bdf.js",
  "sidebar-projects-icon": "sidebar-projects-icon-b86550fdb96c.js",
  "sidebar-plugins-icon": "sidebar-plugins-icon-24009ce205ce.js",
  "sidebar-new-chat-icon": "sidebar-new-chat-icon-57eb7d8c1ce6.js",
  "sidebar-images-icon": "sidebar-images-icon-31c3c9b58364.js",
};

function identifierFor(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

for (const [name, file] of Object.entries(ICONS)) {
  const sourceUrl = pathToFileURL(path.join(sourceDirectory, file));
  sourceUrl.searchParams.set("generatedAt", String(Date.now()));
  const original = (await import(sourceUrl.href)).default;
  if (original == null || typeof original !== "object") {
    throw new Error(`${file} did not export a Lottie object`);
  }

  const identifier = identifierFor(name);
  const outputDirectory = path.join(ROOT, "src/renderer", name);
  const output = `// ${name} —— 侧边栏 Lottie 动画图标。
// 由 scripts/generate-sidebar-lottie-icons.mjs 从官方 chunk 提取，勿手改。

import { n as initializeRuntime } from "@rchunk/rolldown-runtime";
void initializeRuntime;

const ${identifier} = ${JSON.stringify(original, null, 2)} as const;

export default ${identifier};
`;

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(
    path.join(outputDirectory, "index.ts"),
    await prettier.format(output, { parser: "typescript" }),
  );
}

console.log(
  `generated ${Object.keys(ICONS).length} sidebar Lottie icon chunks`,
);
