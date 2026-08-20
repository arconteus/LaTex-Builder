#!/usr/bin/env node

import { copyFile, mkdir, readdir, readFile, unlink } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { basename, dirname, extname, join, resolve } from "node:path";
import kleur from "kleur";

const root = process.cwd();
const templatesRoot = join(root, "templates");
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
  const files = await texFiles();
  if (files.length === 0) throw new Error("No se encontraron archivos .tex.");
  const latexindent = commandPath("latexindent");
  if (latexindent && hasCommand("perl")) {
    await run(latexindent, ["--check", ...files]);
  } else {
    const issues = [];
    for (const file of files) {
      const lines = (await readFile(file, "utf8")).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (/\s+$/.test(line)) issues.push(`${file}:${index + 1} contiene espacios al final`);
        if (line.includes("\t")) issues.push(`${file}:${index + 1} contiene tabuladores`);
      });
    }
    if (issues.length > 0) throw new Error(`Se encontraron problemas de formato:\n${issues.join("\n")}`);
    console.log("\n• Perl no está disponible; se aplicó la verificación interna de espacios y tabuladores.");
  }
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

async function installDependencies({ yes = false } = {}) {
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
  const answer = yes ? "s" : (await ask("¿Continuar? [s/N] ")).trim().toLowerCase();
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
  const mainPath = join(root, "main.tex");
  const source = join(templatesRoot, "classic", "es.tex");
  try {
    await copyFile(source, mainPath, constants.COPYFILE_EXCL);
    console.log("\n✓ Se creó main.tex con la plantilla Classic en español.");
  } catch (error) {
    if (error.code === "EEXIST") {
      console.log("\n• main.tex ya existe; no se modificó.");
      return;
    }
    throw error;
  }
}

async function availableTemplates() {
  const entries = await readdir(templatesRoot, { withFileTypes: true });
  const templates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const files = await readdir(join(templatesRoot, entry.name));
    const languages = files
      .filter((file) => ["es.tex", "en.tex"].includes(file))
      .map((file) => basename(file, ".tex"));
    if (languages.length > 0) templates.push({ name: entry.name, languages });
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

function languageLabel(language) {
  return language === "es" ? "Español" : "English";
}

async function useTemplate(name, language, { yes = false } = {}) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) throw new Error("El nombre de plantilla no es válido.");
  if (!["es", "en"].includes(language)) throw new Error("El idioma debe ser 'es' o 'en'.");
  const source = join(templatesRoot, name, `${language}.tex`);
  if (!existsSync(source)) throw new Error(`No existe la plantilla '${name}' en '${language}'.`);

  const destination = join(root, "main.tex");
  if (existsSync(destination) && !yes) {
    if (!input.isTTY) throw new Error("main.tex ya existe. Repite el comando con --yes para reemplazarlo.");
    const answer = (await ask("main.tex será reemplazado. ¿Continuar? [s/N] ")).trim().toLowerCase();
    if (!["s", "si", "sí", "y", "yes"].includes(answer)) {
      console.log("Selección cancelada.");
      return;
    }
  }
  await copyFile(source, destination);
  console.log(`\n✓ Plantilla '${name}' (${languageLabel(language)}) aplicada a main.tex.`);
}

async function addTemplate(sourcePath, name, language) {
  const source = resolve(root, sourcePath);
  if (extname(source).toLowerCase() !== ".tex" || !existsSync(source)) {
    throw new Error("El origen debe ser un archivo .tex existente.");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) {
    throw new Error("Usa un nombre con letras, números y guiones, por ejemplo 'mi-cv'.");
  }
  if (!["es", "en"].includes(language)) throw new Error("El idioma debe ser 'es' o 'en'.");

  const directory = join(templatesRoot, name.toLowerCase());
  const destination = join(directory, `${language}.tex`);
  if (existsSync(destination)) throw new Error(`La plantilla '${name}' en '${language}' ya existe.`);
  await mkdir(directory, { recursive: true });
  await copyFile(source, destination, constants.COPYFILE_EXCL);
  console.log(`\n✓ Plantilla '${name}' (${languageLabel(language)}) añadida.`);
}

const options = [
  { label: "Limpiar y compilar", detail: "Borra artefactos y genera el PDF", action: () => compile({ clean: true }) },
  { label: "Compilar proyecto", detail: "Genera el PDF con latexmk", action: () => compile() },
  { label: "Elegir plantilla", detail: "Selecciona diseño e idioma", action: chooseTemplateInteractive },
  { label: "Añadir plantilla", detail: "Registra un archivo .tex propio", action: addTemplateInteractive },
  { label: "Verificar formato", detail: "Revisa todos los archivos .tex", action: checkFormat },
  { label: "Instalar dependencias", detail: "Instala una distribución LaTeX", action: () => installDependencies() },
  { label: "Salir", detail: "Cerrar LaTeX Builder", exit: true }
];

function drawMenu(selected, choices, subtitle) {
  output.write("\x1b[2J\x1b[H");
  console.log(pink("╭──────────────────────────────────────────────╮"));
  console.log(pink("│") + "              LaTeX Builder                 " + pink("│"));
  console.log(pink("╰──────────────────────────────────────────────╯"));
  console.log(kleur.dim(`  ${subtitle}\n`));

  choices.forEach((option, index) => {
    const pointer = index === selected ? "❯" : " ";
    const title = ` ${pointer} ${option.label.padEnd(26)}`;
    console.log(index === selected ? pinkSelection(title) : title);
    console.log(kleur.dim(`     ${option.detail}`));
  });
  console.log(kleur.dim("\n  ↑/↓ mover  •  Enter seleccionar  •  q salir"));
}

async function selectOption(choices = options, subtitle = "Compila, revisa y prepara tu proyecto") {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function") {
    console.log("\nLaTeX Builder\n");
    choices.forEach((option, index) => console.log(`  ${index + 1}) ${option.label}`));
    const answer = Number.parseInt(await ask("\nSelecciona una opción: "), 10);
    return choices[answer - 1] ?? null;
  }

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  let selected = 0;
  drawMenu(selected, choices, subtitle);

  return new Promise((resolve) => {
    const finish = (option) => {
      input.off("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
      output.write("\x1b[2J\x1b[H");
      resolve(option);
    };
    const onKeypress = (_character, key) => {
      if (key.ctrl && key.name === "c") return finish(choices.find((choice) => choice.exit) ?? null);
      if (key.name === "q" || key.name === "escape") return finish(choices.find((choice) => choice.exit) ?? null);
      if (key.name === "up" || key.name === "k") selected = (selected - 1 + choices.length) % choices.length;
      else if (key.name === "down" || key.name === "j") selected = (selected + 1) % choices.length;
      else if (key.name === "return") return finish(choices[selected]);
      else return;
      drawMenu(selected, choices, subtitle);
    };
    input.on("keypress", onKeypress);
  });
}

async function chooseTemplateInteractive() {
  const templates = await availableTemplates();
  const selectedTemplate = await selectOption(
    templates.map((template) => ({
      label: template.name,
      detail: template.languages.map(languageLabel).join(" / "),
      template
    })),
    "Elige un diseño"
  );
  if (!selectedTemplate) return;

  const selectedLanguage = await selectOption(
    selectedTemplate.template.languages.map((language) => ({
      label: languageLabel(language),
      detail: `${selectedTemplate.template.name}/${language}.tex`,
      language
    })),
    "Elige el idioma del CV"
  );
  if (selectedLanguage) {
    await useTemplate(selectedTemplate.template.name, selectedLanguage.language);
  }
}

async function addTemplateInteractive() {
  const source = (await ask("Ruta del archivo .tex: ")).trim();
  const name = (await ask("Nombre de la plantilla (ej. mi-cv): ")).trim();
  const selectedLanguage = await selectOption([
    { label: "Español", detail: "Se guardará como es.tex", language: "es" },
    { label: "English", detail: "It will be saved as en.tex", language: "en" }
  ], "Idioma de la nueva plantilla");
  if (selectedLanguage) await addTemplate(source, name, selectedLanguage.language);
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

function printHelp() {
  console.log(`
LaTeX Builder

Uso:
  npm run latexbuilder
  npm run latexbuilder -- <comando> [opciones]

Comandos:
  compile  --compile, -c       Compilar el proyecto
  clean    --clean, -C         Limpiar artefactos y compilar
  templates                    Listar plantillas disponibles
  template                     Aplicar una plantilla a main.tex
  add-template                 Añadir un archivo .tex al catálogo
  check    --check-format, -f  Verificar el formato de los archivos .tex
  install  --install, -i       Instalar las dependencias de LaTeX
  init     --init              Crear main.tex si no existe
  help     --help, -h          Mostrar esta ayuda

Opciones:
  --name <nombre>       Nombre de plantilla
  --language <es|en>    Idioma de plantilla
  --source <ruta>       Archivo .tex que se añadirá
  --yes, -y             Confirmar reemplazo o instalación

Ejemplos:
  npm run latexbuilder -- template --name classic --language es --yes
  npm run latexbuilder -- add-template --source ./mi-cv.tex --name personal --language es

Sin comandos se abre el menú interactivo.
`);
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function listTemplates() {
  const templates = await availableTemplates();
  console.log("\nPlantillas disponibles:\n");
  templates.forEach((template) => {
    console.log(`  ${template.name.padEnd(16)} ${template.languages.map(languageLabel).join(" / ")}`);
  });
}

async function runFromArguments(args) {
  if (args.length === 0) return menu();

  const command = args[0];
  const yes = args.includes("--yes") || args.includes("-y");
  if (["help", "--help", "-h"].includes(command)) return printHelp();
  if (["compile", "--compile", "-c"].includes(command)) return compile();
  if (["clean", "--clean", "-C"].includes(command)) return compile({ clean: true });
  if (["check", "--check-format", "-f"].includes(command)) return checkFormat();
  if (["install", "--install", "-i"].includes(command)) return installDependencies({ yes });
  if (["init", "--init"].includes(command)) return createMainDocument();
  if (command === "templates") return listTemplates();
  if (command === "template") {
    const name = argumentValue(args, "--name");
    const language = argumentValue(args, "--language");
    if (!name || !language) throw new Error("template requiere --name y --language.");
    return useTemplate(name, language, { yes });
  }
  if (command === "add-template") {
    const source = argumentValue(args, "--source");
    const name = argumentValue(args, "--name");
    const language = argumentValue(args, "--language");
    if (!source || !name || !language) {
      throw new Error("add-template requiere --source, --name y --language.");
    }
    return addTemplate(source, name, language);
  }
  throw new Error(`Comando desconocido: ${command}. Usa help para consultar los comandos.`);
}

try {
  await runFromArguments(process.argv.slice(2));
} catch (error) {
  console.error(kleur.red(`\n✗ ${error.message}`));
  process.exitCode = 1;
}
