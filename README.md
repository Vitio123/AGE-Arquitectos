# AGE Arquitectos — Web

Portafolio de AGE Arquitectos (Chiclayo · Cajamarca, Perú) con edificio 3D en Three.js. Proyecto Vite.

## Comandos
```bash
npm install      # instala dependencias
npm run dev      # servidor local con recarga (http://localhost:5173)
npm run build    # genera dist/ para producción
```

## Vercel
Importa el repo en Vercel: detecta Vite solo (build `npm run build`, salida `dist`). Cada push a `main` redepliega.

## Estructura
- `index.html` — contenido de la página
- `src/style.css` — estilos
- `src/ui.js` — proyectos, menú, filtros, lightbox, formulario
- `src/viewer.js` — edificio paramétrico Three.js
- `src/main.js` — arranque
- `public/` — imágenes (logo, fotos)

## Personalizar
- **Logo:** pon `public/logo.png` y reemplaza el bloque `logo-mark` del `<nav>` por `<img src="/logo.png" alt="AGE Arquitectos">`.
- **Fotos:** en `PROYECTOS` (`src/ui.js`) agrega `img: '/casa-zc.jpg'` y deja el archivo en `public/`.
- **Edificio 3D:** parámetros en `src/main.js` (`createBuildingViewer(...)`).
