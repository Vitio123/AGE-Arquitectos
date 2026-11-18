# AGE Arquitectos — Web

Portafolio de AGE Arquitectos (Chiclayo · Cajamarca, Perú) con visor 3D en Three.js.

## Ver en local
Abre `index.html` con Live Server (VS Code) o:

```bash
python3 -m http.server 8000
```
y entra a http://localhost:8000

## Personalizar
- **Logo:** guarda tu logo en `assets/logo.png` y reemplaza el bloque `logo-mark` en el `<nav>` por `<img src="assets/logo.png" alt="AGE Arquitectos">`.
- **Fotos de proyectos:** en el arreglo `PROYECTOS` (dentro de `index.html`) agrega `img: 'assets/nombre.jpg'` a cada proyecto.
- **Edificio 3D:** los parámetros (niveles, ejes, secciones) están en `createBuildingViewer(...)` al final del archivo.
