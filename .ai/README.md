# Entorno de desarrollo con IA

> El repositorio conserva el contexto de trabajo; el agente es reemplazable.

Este entorno independiente del proveedor ofrece memoria compacta y flujos
deterministas compartidos. Ayuda al desarrollo, pero no es un framework de IA.

## Autoridad

El código, la configuración, las dependencias, la documentación canónica y el
estado de Git son autoritativos. La memoria facilita la continuidad y puede
estar obsoleta; cuando contradice al repositorio, gana el repositorio.

## Responsabilidades

- `AGENTS.md` define el comportamiento global de los agentes.
- `context/` contiene requisitos que deben leerse íntegramente.
- `.ai/commands.md` enumera los flujos ejecutables compartidos.
- `.ai/memory/` conserva avances, decisiones y preferencias estructuradas.
- `.ai/tasks/` contiene memoria temporal local para tareas complejas.
- `docs/` contiene conocimiento canónico del proyecto.

La memoria no debe convertirse en una segunda documentación. Promueve el
conocimiento duradero a `docs/`, al código o a la configuración correspondiente.

## Protocolo de memoria

Una tarea compleja puede usar `.ai/tasks/<nombre-kebab-case>.md`, creado desde
`.ai/tasks/TEMPLATE.md`. Registra conclusiones y estado, no conversaciones ni
razonamiento interno. Nunca guardes contraseñas, tokens, credenciales, secretos
o datos personales innecesarios.

Los resultados de validación son `NOT RUN`, `PASS`, `FAIL` o `STALE`. Un `PASS`
solo aplica al estado descrito en `Valid for`; tras cambios relevantes pasa a
`STALE` hasta repetir la comprobación.

## Flujo recomendado

1. Lee `AGENTS.md`, todo `context/`, la documentación relevante y la memoria.
2. Inspecciona Git y verifica cualquier supuesto recordado.
3. Trabaja mediante los comandos de `.ai/commands.md`.
4. Actualiza memoria tras hallazgos, decisiones, progreso o validación material.
5. Al terminar, ejecuta la validación, registra el resultado y deja una acción
   siguiente concreta solo si queda trabajo.
