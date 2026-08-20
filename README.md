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
3. **Elegir plantilla:** permite seleccionar un diseño y su idioma con las flechas.
4. **Añadir plantilla:** registra un archivo `.tex` propio dentro del catálogo.
5. **Verificar formato:** comprueba todos los archivos `.tex` con `latexindent --check`; si falta Perl, usa una validación interna de espacios y tabuladores. No modifica los archivos.
6. **Instalar dependencias:** detecta el sistema operativo, comprueba primero si LaTeX ya está disponible y propone el comando de instalación cuando hace falta. Si se eliminó `main.tex`, recupera una plantilla inicial sin sobrescribir archivos existentes.

En terminales que no soporten interacción (por ejemplo, una tubería o ciertos entornos de CI), el programa cambia automáticamente a un menú numerado compatible.

## Comandos directos

Cada acción del menú tiene un flag para automatización:

```sh
npm run latexbuilder -- compile
npm run latexbuilder -- clean
npm run latexbuilder -- templates
npm run latexbuilder -- template --name classic --language es --yes
npm run latexbuilder -- check
npm run latexbuilder -- install
npm run latexbuilder -- init
npm run latexbuilder -- help
```

Consulta [docs/cli.md](docs/cli.md) para ver los alias y opciones disponibles.

## Plantillas

El catálogo inicial incluye:

- **Dos columnas:** diseño moderno con secciones subrayadas y etiquetas para habilidades.
- **Tower:** diseño lineal y compacto para una lectura tradicional.

Ambas están disponibles en español (`es`) e inglés (`en`). Consulta [docs/templates.md](docs/templates.md) para elegirlas o añadir un diseño propio.

## Personalizar el CV

Elige una plantilla y edita `main.tex` para reemplazar el nombre, datos de contacto, perfil, experiencia, educación, proyectos y habilidades de ejemplo. La plantilla inicial está en español y no incluye datos personales del PDF de referencia.

Al compilar, el script busca los archivos `.tex` de forma recursiva, ignorando `.git`, `node_modules`, `build` y `dist`. Usa `main.tex` cuando existe; en caso contrario, selecciona el primer archivo que contenga `\\documentclass`.

Una estructura mínima sería:

```text
.
├── package.json
├── scripts/
│   ├── bootstrap.mjs
│   └── latexbuilder.mjs
├── templates/
│   └── <nombre>/
└── main.tex
```

El bootstrap se encarga de las dependencias npm del propio menú. La distribución LaTeX es independiente y puede instalarse desde la opción correspondiente; al terminar, esa opción también prepara el primer `main.tex` del proyecto.

## Documentación y contexto para agentes

La documentación técnica está en [docs/](docs/README.md). Las reglas de colaboración se encuentran en [AGENTS.md](AGENTS.md), los requisitos compartidos en [context/](context/README.md) y el historial estructurado en [.ai/memory/](.ai/memory/README.md).

## Licencia

Este proyecto se distribuye bajo la [licencia MIT](LICENSE). Copyright © 2026 Arconteus.
