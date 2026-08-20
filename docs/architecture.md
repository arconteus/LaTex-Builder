# Arquitectura

## Componentes

- `scripts/bootstrap.mjs` instala las dependencias npm del CLI cuando faltan.
- `scripts/latexbuilder.mjs` contiene el menú, el parser de flags y las operaciones LaTeX.
- `main.tex` es la plantilla versionada del CV.
- `context/` contiene requisitos que deben leer los agentes.
- `.ai/memory/` conserva avances, decisiones y preferencias entre sesiones.

El menú y los flags convergen en las mismas funciones internas para mantener resultados consistentes.
