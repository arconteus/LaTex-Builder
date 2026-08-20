# Sistema de plantillas

Las plantillas viven en `templates/<nombre>/<idioma>.tex`. El catálogo reconoce
automáticamente `es.tex` y `en.tex` dentro de cada directorio.

## Plantillas incluidas

- `classic`: diseño moderno de dos columnas con secciones subrayadas.
- `tower`: alternativa lineal, compacta y de una columna.

Ambas contienen únicamente datos ficticios y están disponibles en español e inglés.

## Elegir una plantilla

Desde el menú, selecciona **Elegir plantilla**, el diseño y el idioma. También
puedes usar:

```sh
npm run latexbuilder -- template --name classic --language es --yes
```

La operación copia la plantilla a `main.tex`. Sin `--yes`, pide confirmación
antes de reemplazar un documento existente.

## Añadir una plantilla

Desde el menú, selecciona **Añadir plantilla** e indica la ruta, el nombre y el
idioma. Para automatización:

```sh
npm run latexbuilder -- add-template \
  --source ./mi-cv.tex \
  --name personal \
  --language es
```

El origen debe ser un `.tex` existente. Los nombres aceptan letras, números y
guiones. El CLI nunca sobrescribe una variante que ya esté registrada.

También puedes crear manualmente `templates/personal/es.tex` o
`templates/personal/en.tex`; aparecerá en el catálogo en la siguiente ejecución.
