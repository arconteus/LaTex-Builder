#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kleurManifest = resolve(projectRoot, "node_modules", "kleur", "package.json");

if (!existsSync(kleurManifest)) {
  console.log("Preparando LaTeX Builder por primera vez...\n");
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : "npm";
  const args = npmCli
    ? [npmCli, "install", "--no-audit", "--no-fund"]
    : ["install", "--no-audit", "--no-fund"];
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: !npmCli && process.platform === "win32"
  });

  if (result.error) {
    console.error(`No fue posible iniciar npm: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error("No fue posible instalar las dependencias del menú.");
    process.exit(result.status ?? 1);
  }
}

await import("./latexbuilder.mjs");
