# LaTeX Builder

Un punto de entrada único para crear y mantener un CV en LaTeX. El repositorio incluye desde el principio un `main.tex` listo para personalizar y todo se controla desde un menú interactivo iniciado con un solo comando de npm.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o posterior.
- npm, incluido con Node.js.
- Para compilar inmediatamente: una distribución LaTeX que incluya `latexmk` y `latexindent`.

Si todavía no tienes LaTeX, el propio menú puede instalarlo mediante Winget o Chocolatey en Windows, Homebrew en macOS, y APT, DNF o Pacman en Linux.

## Uso

Desde la raíz del proyecto ejecuta:

```sh
npm run latexbuilder
```

No necesitas ejecutar `npm install` antes. El comando funciona como bootstrap: en la primera ejecución detecta si falta `kleur`, instala automáticamente las dependencias npm del menú y, al terminar, abre LaTeX Builder. Las ejecuciones posteriores arrancan directamente.

Se abrirá una interfaz interactiva con el color principal `#FF7DAD`: usa las flechas `↑` y `↓` para moverte, `Enter` para ejecutar una opción y `q` o `Esc` para salir. También puedes navegar con `j` y `k`. El elemento activo aparece resaltado.

El menú ofrece:

1. **Limpiar y compilar:** elimina los artefactos generados y crea de nuevo el PDF.
2. **Compilar:** usa `latexmk` cuando está disponible y tiene un motor Perl. Si MiKTeX no incluye Perl, cambia automáticamente a dos pasadas de `pdflatex` para resolver las referencias habituales, sin exigir una instalación adicional.
3. **Verificar formato:** comprueba todos los archivos `.tex` con `latexindent --check` sin modificarlos.
4. **Instalar dependencias:** detecta el sistema operativo, comprueba primero si LaTeX ya está disponible y propone el comando de instalación cuando hace falta. Si se eliminó `main.tex`, recupera una plantilla inicial sin sobrescribir archivos existentes.

En terminales que no soporten interacción (por ejemplo, una tubería o ciertos entornos de CI), el programa cambia automáticamente a un menú numerado compatible.

## Comandos directos

Cada acción del menú tiene un flag para automatización:

```sh
npm run latexbuilder -- compile
npm run latexbuilder -- clean
npm run latexbuilder -- check
npm run latexbuilder -- install
npm run latexbuilder -- init
npm run latexbuilder -- help
```

Consulta [docs/cli.md](docs/cli.md) para ver los alias y opciones disponibles.

## Personalizar el CV

Edita `main.tex` y reemplaza el nombre, datos de contacto, perfil, experiencia, educación, proyectos y habilidades de ejemplo. La plantilla utiliza el mismo color principal `#FF7DAD` que el CLI.

Al compilar, el script busca los archivos `.tex` de forma recursiva, ignorando `.git`, `node_modules`, `build` y `dist`. Usa `main.tex` cuando existe; en caso contrario, selecciona el primer archivo que contenga `\\documentclass`.

Una estructura mínima sería:

```text
.
├── package.json
├── scripts/
│   ├── bootstrap.mjs
│   └── latexbuilder.mjs
└── main.tex
```

El bootstrap se encarga de las dependencias npm del propio menú. La distribución LaTeX es independiente y puede instalarse desde la opción correspondiente; al terminar, esa opción también prepara el primer `main.tex` del proyecto.

## Documentación y contexto para agentes

La documentación técnica está en [docs/](docs/README.md). Las reglas de colaboración se encuentran en [AGENTS.md](AGENTS.md), los requisitos compartidos en [context/](context/README.md) y el historial estructurado en [.ai/memory/](.ai/memory/README.md).
