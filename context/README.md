# Contexto del proyecto

Todos los agentes deben leer íntegramente esta carpeta antes de modificar el repositorio.

## Objetivo actual

LaTeX Builder ofrece un punto de entrada npm interactivo y multiplataforma para preparar, editar, verificar y compilar un CV en LaTeX.

## Restricciones vigentes

- El menú se navega con teclado y usa `#FF7DAD` como color principal.
- El proyecto incluye `main.tex` desde el primer clon.
- La preparación de dependencias npm funciona como bootstrap.
- La compilación usa `latexmk` cuando puede ejecutarse y recurre a dos pasadas de `pdflatex` si falta Perl.
- Los artefactos de LaTeX y los PDF no se versionan.
- El catálogo ofrece las plantillas `paris` y `towers` en español e inglés y descubre nuevas variantes bajo `templates/<nombre>/<idioma>.tex`.
