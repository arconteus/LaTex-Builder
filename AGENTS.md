# Instrucciones de desarrollo con IA

El repositorio es la fuente autoritativa. El código, la configuración, la
documentación, las dependencias, las pruebas y el estado de Git prevalecen sobre
cualquier recuerdo.

## Reglas de ejecución

1. Inspecciona el estado actual de Git y los archivos relevantes.
2. Lee y considera **todos** los archivos de [`context/`](context/README.md)
   antes de planear o modificar el proyecto.
3. Sigue la documentación canónica de [`docs/`](docs/README.md) y las
   convenciones existentes.
4. Usa exclusivamente los flujos compartidos de [`.ai/commands.md`](.ai/commands.md);
   no inventes alternativas específicas para agentes.
5. Ejecuta la validación apropiada antes de considerar terminado el trabajo y
   reporta honestamente cualquier fallo.

## Idioma y datos de LaTeX

- Antes de crear o modificar contenido textual de LaTeX, pregunta directamente
  al usuario en qué idioma quiere el documento, salvo que exista una preferencia
  inequívoca en [`.ai/memory/user-preferences.md`](.ai/memory/user-preferences.md).
- Si falta cualquier dato necesario, pregúntalo directamente. No inventes datos
  personales, fechas, experiencia, estudios, enlaces ni logros.
- Registra la elección de idioma y demás preferencias estables en la memoria.

## Memoria de trabajo

- Lee [`.ai/README.md`](.ai/README.md), la memoria estructurada relevante de
  `.ai/memory/` y cualquier tarea activa de `.ai/tasks/`.
- Registra avances materiales en `.ai/memory/progress.md`, decisiones explícitas
  en `.ai/memory/decisions.md` y preferencias estables en
  `.ai/memory/user-preferences.md`. Usa fecha ISO, estado, tema, fuente y detalles.
- Para una tarea compleja, crea memoria temporal desde
  [`.ai/tasks/TEMPLATE.md`](.ai/tasks/TEMPLATE.md). Conserva conclusiones,
  decisiones, progreso, enfoques rechazados relevantes, validación y una única
  acción siguiente.
- No almacenes transcripciones, razonamiento interno, grandes salidas de
  comandos, diffs completos, secretos ni datos sensibles.
- La memoria puede quedar obsoleta. Verifica los hechos importantes contra el
  repositorio; si existe una contradicción, el repositorio prevalece.
- Considera obsoleta una validación después de cambiar código, configuración,
  documentación operativa o dependencias relacionadas.

## Seguridad de Git

- Las memorias activas `.ai/tasks/<tarea>.md` son locales. Nunca las prepares,
  confirmes, publiques ni incluyas en un pull request; solo se versiona la plantilla.
- Nunca hagas commit, push, merge, crees un pull request o modifiques estado
  remoto sin una solicitud explícita del usuario.
