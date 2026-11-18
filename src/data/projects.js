/*
 * Proyectos del portafolio.
 *  model → maqueta 3D que se muestra mientras no haya fotos
 *          ('modern' | 'gable' | 'pavilion' | 'store')
 *  opts  → variaciones de la maqueta
 *  img   → (opcional) ruta a una foto real en /public, ej. '/casa-zc.jpg'
 *  size  → 'big' ocupa más ancho en escritorio
 */
export const PROJECTS = [
  { name: 'Casa ZC',            tag: 'Residencial',             loc: 'Chiclayo',           cat: 'residencial', size: 'big', model: 'modern',   opts: {} },
  { name: 'Casa Collud',        tag: 'Residencial',             loc: 'Pomalca — Chiclayo', cat: 'residencial',              model: 'gable',    opts: {} },
  { name: 'Casa Olazabal',      tag: 'Residencial',             loc: 'Chiclayo',           cat: 'residencial',              model: 'modern',   opts: { pool: false, slats: false } },
  { name: 'Casa Rojas',         tag: 'Residencial',             loc: 'Chiclayo',           cat: 'residencial',              model: 'gable',    opts: { wall: 'plaster' } },
  { name: 'Casa Oasis',         tag: 'Residencial · Viz 3D',    loc: 'Paracas',            cat: 'residencial',              model: 'modern',   opts: { ground: 'sand' } },
  { name: 'Casa Playa Hueso',   tag: 'Residencial · Viz 3D',    loc: 'Lima',               cat: 'residencial',              model: 'pavilion', opts: { beach: true } },
  { name: 'Casa Caballeriza',   tag: 'Residencial · Viz 3D',    loc: 'Lima',               cat: 'residencial', size: 'big', model: 'gable',    opts: { long: true } },
  { name: 'Alma Beauty Studio', tag: 'Comercial',               loc: 'Cajamarca',          cat: 'comercial',                model: 'store',    opts: { wall: 'white', floors: 1 } },
  { name: 'Doñary',             tag: 'Comercial',               loc: 'Cajamarca',          cat: 'comercial',                model: 'store',    opts: { floors: 2 } },
  { name: 'Orgánica Café',      tag: 'Restaurante · Café',      loc: 'Lambayeque',         cat: 'comercial',   size: 'big', model: 'pavilion', opts: {} },
  { name: 'Mitoz',              tag: 'Comercial',               loc: 'Cajamarca',          cat: 'comercial',                model: 'store',    opts: { wall: 'plaster', floors: 1, warmSign: false } },
  { name: 'Tasca',              tag: 'Restaurante · Bar',       loc: 'Cajamarca',          cat: 'comercial',                model: 'store',    opts: { wall: 'wood', floors: 1 } },
  { name: 'Alegoría',           tag: 'Comercial · Gastronomía', loc: 'Cajamarca',          cat: 'comercial',                model: 'pavilion', opts: { ground: 'paving' } },
];
