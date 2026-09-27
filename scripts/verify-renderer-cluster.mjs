#!/usr/bin/env node
// Renderer 语义簇统一门禁：定向测试 → 构建 → 结构验证 → tsc 基线 → diff 纪律。
//
// 示例：
//   node scripts/verify-renderer-cluster.mjs \
//     --test scripts/test-login-auth-model-cluster.mjs \
//     --module chatgpt-desktop-auth-url:13 \
//     --module browser-session-queries:9 \
//     --module browser-login-handoff-page-core:11

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArguments(arguments_) {
  const options = {
    baseline: 73,
    modules: [],
    tests: [],
  };
  for (let index = 0; index < arguments_.length; index++) {
    const argument = arguments_[index];
    if (argument === "--help" || argument === "-h")
      return { ...options, help: true };
    if (argument === "--test") {
      options.tests.push(requireValue(arguments_, ++index, argument));
      continue;
    }
    if (argument === "--module") {
      const value = requireValue(arguments_, ++index, argument);
      const separator = value.lastIndexOf(":");
      const name = value.slice(0, separator);
      const assertions = Number(value.slice(separator + 1));
      if (separator <= 0 || !Number.isInteger(assertions) || assertions < 0) {
        throw new Error(`--module 格式应为 <name>:<assertions>，收到 ${value}`);
      }
      options.modules.push({ assertions, name });
      continue;
    }
    if (argument === "--tsc-baseline") {
      options.baseline = Number(requireValue(arguments_, ++index, argument));
      if (!Number.isInteger(options.baseline) || options.baseline < 0) {
        throw new Error("--tsc-baseline 必须是非负整数");
      }
      continue;
    }
    throw new Error(`未知参数：${argument}`);
  }
  if (options.tests.length === 0) throw new Error("至少需要一个 --test");
  if (options.modules.length === 0) throw new Error("至少需要一个 --module");
  return options;
}

function requireValue(arguments_, index, flag) {
  const value = arguments_[index];
  if (value == null || value.startsWith("--"))
    throw new Error(`${flag} 缺少参数`);
  return value;
}

function printHelp() {
  console.log(`用法：node scripts/verify-renderer-cluster.mjs [options]

  --test <path>             定向测试脚本，可重复
  --module <name>:<count>   模块名与断言数，可重复
  --tsc-baseline <count>    TypeScript 错误基线，默认 73
  -h, --help                显示帮助`);
}

function run(command, arguments_, { acceptFailure = false } = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!acceptFailure && result.status !== 0) {
    const output = [result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n")
      .trim();
    throw new Error(
      `${command} ${arguments_.join(" ")} 失败（exit ${result.status}）\n${output}`,
    );
  }
  return {
    output: [result.stdout, result.stderr].filter(Boolean).join("\n").trim(),
    status: result.status,
  };
}

function countAssertions(testPaths) {
  return testPaths.reduce((total, testPath) => {
    const source = fs.readFileSync(path.resolve(ROOT, testPath), "utf8");
    return total + [...source.matchAll(/\bassert\s*\./g)].length;
  }, 0);
}

function readAddedLines() {
  const trackedDiff = run("git", [
    "diff",
    "HEAD",
    "--unified=0",
    "--no-color",
  ]).output;
  const lines = trackedDiff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
  const untracked = run("git", [
    "ls-files",
    "--others",
    "--exclude-standard",
  ]).output;
  for (const relativePath of untracked.split("\n").filter(Boolean)) {
    const absolutePath = path.resolve(ROOT, relativePath);
    if (!fs.statSync(absolutePath).isFile()) continue;
    lines.push(...fs.readFileSync(absolutePath, "utf8").split("\n"));
  }
  return lines;
}

function ensureDiffDiscipline() {
  run("git", ["diff", "--check", "HEAD"]);
  const addedLines = readAddedLines();
  const anyViolations = addedLines.filter((line) =>
    /(?:\:\s*any\b|\bas\s+any\b)/.test(line),
  );
  if (anyViolations.length > 0) {
    throw new Error(
      `新增 any ${anyViolations.length} 处：\n${anyViolations.slice(0, 20).join("\n")}`,
    );
  }
  const compressedNamespaceUses = addedLines.filter(
    (line) =>
      /\b[A-Za-z_$][\w$]*Chunk\.[A-Za-z_$][\w$]*/.test(line) &&
      !/\bvoid\s+[A-Za-z_$][\w$]*Chunk\b/.test(line),
  );
  if (compressedNamespaceUses.length > 0) {
    throw new Error(
      `发现直接 namespace chunk 消费 ${compressedNamespaceUses.length} 处，请先解构为语义名：\n${compressedNamespaceUses.slice(0, 20).join("\n")}`,
    );
  }
  return { anyCount: 0, compressedNamespaceCount: 0 };
}

function parseVerifiedCount(output, pattern, label) {
  const match = output.match(pattern);
  if (match == null) throw new Error(`无法从 ${label} 输出中解析验证数量`);
  return Number(match[1]);
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`参数错误：${error.message}`);
    printHelp();
    process.exit(2);
  }
  if (options.help) {
    printHelp();
    return;
  }

  const declaredAssertions = options.modules.reduce(
    (sum, module) => sum + module.assertions,
    0,
  );
  const actualAssertions = countAssertions(options.tests);
  if (declaredAssertions !== actualAssertions) {
    throw new Error(
      `断言数不一致：--module 合计 ${declaredAssertions}，测试源码实际 ${actualAssertions}`,
    );
  }

  const targetedOutputs = [];
  for (const testPath of options.tests) {
    targetedOutputs.push(
      run(process.execPath, [testPath]).output.split("\n").at(-1),
    );
  }

  run(process.execPath, ["scripts/build-renderer.mjs"]);
  const rendererOutput = run(process.execPath, [
    "scripts/verify-renderer.mjs",
  ]).output;
  const rendererCount = parseVerifiedCount(
    rendererOutput,
    /(\d+)\/\d+ renderer chunks verified, 0 failures/,
    "verify-renderer",
  );
  const mainOutput = run(process.execPath, [
    "scripts/verify-chunks.mjs",
  ]).output;
  const mainCount = parseVerifiedCount(
    mainOutput,
    /全部 (\d+) 个已重写 chunk 与原始产物结构等价/,
    "verify-chunks",
  );
  const typecheck = run(
    "npm",
    ["exec", "tsc", "--", "--noEmit", "--pretty", "false"],
    {
      acceptFailure: true,
    },
  );
  const typeScriptErrors = [...typecheck.output.matchAll(/error TS\d+:/g)]
    .length;
  if (typeScriptErrors > options.baseline) {
    throw new Error(
      `TypeScript 错误 ${typeScriptErrors}，超过基线 ${options.baseline}\n${typecheck.output}`,
    );
  }
  const discipline = ensureDiffDiscipline();

  console.log("\nRenderer 簇门禁通过");
  for (const output of targetedOutputs) console.log(`- ${output}`);
  console.log(`- renderer：${rendererCount}/${rendererCount}`);
  console.log(`- main：${mainCount}/${mainCount}`);
  console.log(`- tsc：${typeScriptErrors}（基线 ${options.baseline}）`);
  console.log(`- 新增 any：${discipline.anyCount}`);
  console.log(
    `- 直接 chunk namespace 消费：${discipline.compressedNamespaceCount}`,
  );
  console.log("\nCommit body：");
  console.log("模块验证：");
  for (const module of options.modules) {
    console.log(`- ${module.name}：${module.assertions}/${module.assertions}`);
  }
  console.log(
    `\n全量门禁：renderer ${rendererCount}/${rendererCount}，main ${mainCount}/${mainCount}，tsc ${typeScriptErrors}（基线 ${options.baseline}），新增 any 0。`,
  );
}

try {
  main();
} catch (error) {
  console.error(`\nRenderer 簇门禁失败：${error.message}`);
  process.exit(1);
}
