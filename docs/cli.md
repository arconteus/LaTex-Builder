# Interfaz de línea de comandos

## Menú interactivo

```sh
npm run latexbuilder
```

Usa `↑` y `↓` (o `j` y `k`) para navegar, `Enter` para seleccionar y `q` o `Esc` para salir.

## Flags

```sh
npm run latexbuilder -- compile
npm run latexbuilder -- clean
npm run latexbuilder -- templates
npm run latexbuilder -- template --name classic --language es --yes
npm run latexbuilder -- add-template --source ./mi-cv.tex --name personal --language es
npm run latexbuilder -- check
npm run latexbuilder -- install
npm run latexbuilder -- install --yes
npm run latexbuilder -- init
npm run latexbuilder -- help
```

También están disponibles los flags largos `--compile`, `--clean`, `--check-format`, `--install`, `--init` y `--help`. Los alias cortos son `-c`, `-C`, `-f`, `-i` y `-h`; `-y` equivale a `--yes`. Solo se puede ejecutar una acción principal por invocación.

Los flags llaman a las mismas funciones que el menú, por lo que son apropiados para automatización y CI.

`template` requiere `--name` y `--language`. Usa `--yes` para autorizar el reemplazo de `main.tex`. `add-template` requiere además `--source` y rechaza variantes existentes para evitar sobrescrituras accidentales.
