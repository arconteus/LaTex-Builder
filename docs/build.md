# Flujo de compilación

1. El CLI localiza `main.tex` o el primer documento que contenga `\\documentclass`.
2. Si `latexmk` y su motor Perl están disponibles, ejecuta `latexmk -pdf`.
3. Si falta Perl o `latexmk`, ejecuta dos pasadas de `pdflatex`.
4. En Windows también busca las herramientas en las ubicaciones habituales de MiKTeX aunque no estén en `PATH`.
5. La limpieza elimina únicamente los artefactos asociados al documento principal antes de reconstruirlo.

La verificación de formato usa `latexindent --check` cuando Perl está disponible.
Si falta Perl, aplica una comprobación interna de espacios finales y tabuladores.
Ninguno de los dos modos modifica los archivos fuente.
