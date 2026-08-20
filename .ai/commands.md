# Comandos del repositorio

Usa LaTeX Builder para los flujos compartidos. Ejecuta todo desde la raíz.

```shell
npm run latexbuilder                  # Abrir el menú interactivo
npm run latexbuilder -- compile       # Compilar el CV
npm run latexbuilder -- clean         # Limpiar y compilar el CV
npm run latexbuilder -- templates     # Listar diseños e idiomas
npm run latexbuilder -- template --name paris --language es --yes # Aplicar diseño
npm run latexbuilder -- check         # Verificar formato de archivos .tex
npm run latexbuilder -- install       # Instalar dependencias de LaTeX
npm run latexbuilder -- install --yes # Instalar sin confirmación
npm run latexbuilder -- init          # Crear main.tex si falta
npm run latexbuilder -- help          # Mostrar comandos y flags
```

También se aceptan los flags equivalentes `--compile`, `--clean`,
`--check-format`, `--install`, `--init` y `--help`. La gestión completa de
plantillas está documentada en `docs/templates.md`.

Usa `check` y una compilación apropiada antes de considerar completa una
modificación de LaTeX. No crees comandos alternativos exclusivos para agentes.
