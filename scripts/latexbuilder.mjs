#!/usr/bin/env node

import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { basename, dirname, join } from "node:path";
import kleur from "kleur";

const root = process.cwd();
kleur.enabled = output.isTTY && !process.env.NO_COLOR;
const pink = (text) => kleur.enabled ? `\x1b[38;2;255;125;173m${text}\x1b[0m` : text;
const pinkSelection = (text) => kleur.enabled ? `\x1b[30;48;2;255;125;173m${text}\x1b[0m` : text;

async function ask(question) {
  const rl = createInterface({ input, output });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

function commandPath(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  if (spawnSync(checker, [command], { stdio: "ignore" }).status === 0) return command;

  if (process.platform === "win32") {
    const executable = command.endsWith(".exe") ? command : `${command}.exe`;
    const roots = [
      process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs", "MiKTeX", "miktex", "bin"),
      process.env.ProgramFiles && join(process.env.ProgramFiles, "MiKTeX", "miktex", "bin"),
      process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "MiKTeX", "miktex", "bin")
    ].filter(Boolean);
    for (const directory of roots) {
      for (const architecture of ["x64", "x86", ""]) {
        const candidate = join(directory, architecture, executable);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

function hasCommand(command) {
  return commandPath(command) !== null;
}

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      ...options
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`El comando terminó con código ${code}.`));
    });
  });
}

async function texFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "build", "dist"].includes(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await texFiles(path)));
    else if (entry.name.endsWith(".tex")) files.push(path);
  }
  return files;
}

async function mainDocument() {
  const files = await texFiles();
  if (files.length === 0) throw new Error("No se encontraron archivos .tex.");

  const preferred = files.find((file) => /[/\\]main\.tex$/i.test(file));
  if (preferred) return preferred;

  for (const file of files) {
    if ((await readFile(file, "utf8")).includes("\\documentclass")) return file;
  }
  throw new Error("No se encontró un documento raíz con \\documentclass.");
}

function requireCommand(command, hint) {
  const resolved = commandPath(command);
  if (!resolved) {
    throw new Error(`No se encontró '${command}'. ${hint}`);
  }
  return resolved;
}

async function compile({ clean = false } = {}) {
  const document = await mainDocument();
  const latexmk = commandPath("latexmk");
  const latexmkIsUsable = latexmk && (process.platform !== "win32" || hasCommand("perl"));
  if (latexmkIsUsable) {
    if (clean) await run(latexmk, ["-C", document]);
    await run(latexmk, ["-pdf", "-interaction=nonstopmode", "-file-line-error", document]);
    return;
  }

  const pdflatex = requireCommand("pdflatex", "Abre una terminal nueva o usa la opción de instalar dependencias.");
  if (clean) await cleanArtifacts(document);
  const reason = latexmk && process.platform === "win32"
    ? "latexmk requiere Perl y Perl no está instalado"
    : "latexmk no está disponible";
  console.log(`\n• ${reason}; se usará pdflatex en dos pasadas.\n`);
  const args = [
    "-interaction=nonstopmode",
    "-file-line-error",
    `-output-directory=${dirname(document)}`,
    document
  ];
  await run(pdflatex, args);
  await run(pdflatex, args);
}

async function cleanArtifacts(document) {
  const directory = dirname(document);
  const name = basename(document, ".tex");
  const extensions = [
    "aux", "bbl", "bcf", "blg", "fdb_latexmk", "fls", "log", "out",
    "pdf", "run.xml", "synctex.gz", "toc"
  ];

  await Promise.all(extensions.map(async (extension) => {
    try {
      await unlink(join(directory, `${name}.${extension}`));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }));
}

async function checkFormat() {
  const latexindent = requireCommand("latexindent", "Usa la opción de instalar dependencias.");
  const files = await texFiles();
  if (files.length === 0) throw new Error("No se encontraron archivos .tex.");
  await run(latexindent, ["--check", ...files]);
  console.log("\n✓ Todos los archivos .tex tienen el formato esperado.");
}

function installer() {
  if (process.platform === "win32") {
    if (hasCommand("winget")) return ["winget", ["install", "--id", "MiKTeX.MiKTeX", "--exact", "--interactive"]];
    if (hasCommand("choco")) return ["choco", ["install", "miktex", "-y"]];
  }
  if (process.platform === "darwin" && hasCommand("brew")) {
    return ["brew", ["install", "--cask", "mactex-no-gui"]];
  }
  if (hasCommand("apt-get")) return ["sudo", ["apt-get", "install", "-y", "latexmk", "texlive-latex-extra", "latexindent"]];
  if (hasCommand("dnf")) return ["sudo", ["dnf", "install", "-y", "latexmk", "texlive-scheme-medium", "latexindent"]];
  if (hasCommand("pacman")) return ["sudo", ["pacman", "-S", "--needed", "texlive-meta", "latexmk"]];
  return null;
}

function latexIsInstalled() {
  if (hasCommand("latexmk") || hasCommand("pdflatex")) return true;
  if (process.platform === "win32" && hasCommand("winget")) {
    const result = spawnSync("winget", ["list", "--id", "MiKTeX.MiKTeX", "--exact"], {
      stdio: "ignore"
    });
    return result.status === 0;
  }
  return false;
}

async function installDependencies() {
  if (latexIsInstalled()) {
    console.log("\n✓ La distribución LaTeX ya está instalada.");
    await createMainDocument();
    console.log("\nAbre una terminal nueva si latexmk todavía no aparece en el PATH.");
    return;
  }

  const selected = installer();
  if (!selected) throw new Error("No se encontró un gestor compatible. Instala TeX Live, MacTeX o MiKTeX manualmente.");
  const [command, args] = selected;
  console.log(`\nSe ejecutará: ${command} ${args.join(" ")}\n`);
  const answer = (await ask("¿Continuar? [s/N] ")).trim().toLowerCase();
  if (!["s", "si", "sí", "y", "yes"].includes(answer)) {
    console.log("Instalación cancelada.");
    return;
  }
  try {
    await run(command, args);
  } catch (error) {
    // Winget devuelve un código distinto de cero cuando el paquete ya existe
    // y no hay una versión más reciente. En ese caso la instalación es válida.
    if (!latexIsInstalled()) throw error;
    console.log("\n✓ LaTeX ya estaba instalado; no había actualizaciones disponibles.");
  }
  await createMainDocument();
  console.log("\n✓ Dependencias instaladas. Abre una terminal nueva si los comandos aún no aparecen.");
}

async function createMainDocument() {
  const mainPath = `${root}/main.tex`;
  const template = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish]{babel}
\usepackage[a4paper,margin=1.7cm]{geometry}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{tabularx}
\usepackage{parskip}

\definecolor{accent}{HTML}{FF7DAD}
\definecolor{text}{HTML}{242424}
\definecolor{muted}{HTML}{666666}

\hypersetup{colorlinks=true,urlcolor=text,linkcolor=text}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=3pt}
\titleformat{\section}{\large\bfseries\color{text}}{}{0pt}{}
  [\vspace{-0.5em}{\color{accent}\rule{\linewidth}{1.5pt}}]
\titlespacing*{\section}{0pt}{1.2em}{0.5em}

\begin{document}

\begin{center}
  {\Huge\bfseries Nombre Apellido}\\[0.35em]
  {\large\color{accent}Desarrollador de Software}\\[0.6em]
  \href{mailto:correo@ejemplo.com}{correo@ejemplo.com}
  \quad\textcolor{accent}{\textbullet}\quad +52 000 000 0000
  \quad\textcolor{accent}{\textbullet}\quad Ciudad, País
\end{center}

\section{Perfil}

Sustituye este texto por un resumen breve de tu experiencia, especialidad y
el valor que aportas.

\section{Experiencia}

\textbf{Puesto más reciente} \hfill \textcolor{muted}{2024--Actualidad}\\
\textit{Empresa, Ciudad}
\begin{itemize}
  \item Describe un resultado concreto e incluye métricas cuando sea posible.
  \item Explica qué construiste y cuál fue su impacto.
\end{itemize}

\section{Educación}

\textbf{Nombre del programa o carrera} \hfill \textcolor{muted}{2018--2022}\\
Universidad o institución

\section{Habilidades}

JavaScript, TypeScript, Python, SQL, Git, Docker y Node.js.

\end{document}
`;

  try {
    await writeFile(mainPath, template, { encoding: "utf8", flag: "wx" });
    console.log("\n✓ Se creó main.tex con una plantilla inicial.");
  } catch (error) {
    if (error.code === "EEXIST") {
      console.log("\n• main.tex ya existe; no se modificó.");
      return;
    }
    throw error;
  }
}

const options = [
  { label: "Limpiar y compilar", detail: "Borra artefactos y genera el PDF", action: () => compile({ clean: true }) },
  { label: "Compilar proyecto", detail: "Genera el PDF con latexmk", action: () => compile() },
  { label: "Verificar formato", detail: "Revisa todos los archivos .tex", action: checkFormat },
  { label: "Instalar dependencias", detail: "Instala una distribución LaTeX", action: installDependencies },
  { label: "Salir", detail: "Cerrar LaTeX Builder", exit: true }
];

function drawMenu(selected) {
  output.write("\x1b[2J\x1b[H");
  console.log(pink("╭──────────────────────────────────────────────╮"));
  console.log(pink("│") + "              LaTeX Builder                 " + pink("│"));
  console.log(pink("╰──────────────────────────────────────────────╯"));
  console.log(kleur.dim("  Compila, revisa y prepara tu proyecto\n"));

  options.forEach((option, index) => {
    const pointer = index === selected ? "❯" : " ";
    const title = ` ${pointer} ${option.label.padEnd(26)}`;
    console.log(index === selected ? pinkSelection(title) : title);
    console.log(kleur.dim(`     ${option.detail}`));
  });
  console.log(kleur.dim("\n  ↑/↓ mover  •  Enter seleccionar  •  q salir"));
}

async function selectOption() {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function") {
    console.log("\nLaTeX Builder\n");
    options.forEach((option, index) => console.log(`  ${index + 1}) ${option.label}`));
    const answer = Number.parseInt(await ask("\nSelecciona una opción: "), 10);
    return options[answer - 1] ?? null;
  }

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  let selected = 0;
  drawMenu(selected);

  return new Promise((resolve) => {
    const finish = (option) => {
      input.off("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
      output.write("\x1b[2J\x1b[H");
      resolve(option);
    };
    const onKeypress = (_character, key) => {
      if (key.ctrl && key.name === "c") return finish(options.at(-1));
      if (key.name === "q" || key.name === "escape") return finish(options.at(-1));
      if (key.name === "up" || key.name === "k") selected = (selected - 1 + options.length) % options.length;
      else if (key.name === "down" || key.name === "j") selected = (selected + 1) % options.length;
      else if (key.name === "return") return finish(options[selected]);
      else return;
      drawMenu(selected);
    };
    input.on("keypress", onKeypress);
  });
}

async function menu() {
  while (true) {
    const selected = await selectOption();
    if (!selected) continue;
    if (selected.exit) break;
    try {
      await selected.action();
      console.log(kleur.green("\n✓ Operación terminada."));
    } catch (error) {
      console.error(`\n✗ ${error.message}`);
    }
    if (input.isTTY) await ask(kleur.dim("\nPresiona Enter para volver al menú..."));
  }
}

await menu();
