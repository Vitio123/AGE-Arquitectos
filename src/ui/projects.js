import { PROJECTS } from '../data/projects.js';

const ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/**
 * Pinta las tarjetas de proyectos y los filtros.
 * onCardMedia(canvas, project) → se llama para cada tarjeta sin foto (para la maqueta 3D).
 * onOpen(project, index)       → se llama al abrir un proyecto.
 */
export function initProjects({ onCardMedia, onOpen }) {
  const grid = document.getElementById('projectsGrid');

  grid.innerHTML = PROJECTS.map((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    const media = p.img
      ? `<img src="${p.img}" alt="${p.name}" loading="lazy" onload="this.classList.add('is-loaded')">`
      : `<canvas aria-hidden="true"></canvas>`;
    return `
      <article class="project ${p.size || ''} reveal" data-cat="${p.cat}" data-i="${i}" tabindex="0" role="button" aria-label="Ver ${p.name}">
        <div class="project-media">
          ${media}<div class="skeleton"></div>
          <span class="project-num">${num}</span>
          ${p.img ? '' : '<span class="project-3d-badge">3D</span>'}
        </div>
        <div class="project-body">
          <div>
            <p class="project-tag">${p.tag}</p>
            <h3 class="project-name">${p.name}</h3>
            <p class="project-loc">${p.loc}, Perú</p>
          </div>
          <span class="project-arrow">${ARROW}</span>
        </div>
        <span class="glare"></span>
      </article>`;
  }).join('');

  grid.querySelectorAll('.project').forEach(card => {
    const p = PROJECTS[card.dataset.i];
    const canvas = card.querySelector('canvas');
    if (canvas) onCardMedia(canvas, p);
  });

  const open = card => onOpen(PROJECTS[card.dataset.i], +card.dataset.i);
  grid.addEventListener('click', e => { const c = e.target.closest('.project'); if (c) open(c); });
  grid.addEventListener('keydown', e => {
    const c = e.target.closest('.project');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(c); }
  });

  // Filtros
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-selected', c === chip); });
    const f = chip.dataset.filter;
    grid.querySelectorAll('.project').forEach(card => {
      card.classList.toggle('is-hidden', f !== 'all' && card.dataset.cat !== f);
    });
  }));
}
