// Interfaz: proyectos, menú, filtros, lightbox, formulario
// Proyectos: para agregar foto, pon la ruta en "img" (ej. "/casa-zc.jpg", archivo en public/)
const PROYECTOS = [
  { n:'Casa ZC',            tag:'Residencial',             loc:'Chiclayo',           cat:'residencial', size:'large'  },
  { n:'Casa Collud',        tag:'Residencial',             loc:'Pomalca — Chiclayo', cat:'residencial', size:'medium' },
  { n:'Casa Olazabal',      tag:'Residencial',             loc:'Chiclayo',           cat:'residencial', size:'medium' },
  { n:'Casa Rojas',         tag:'Residencial',             loc:'Chiclayo',           cat:'residencial', size:'large'  },
  { n:'Casa Oasis',         tag:'Residencial · Viz 3D',    loc:'Paracas',            cat:'residencial', size:'third'  },
  { n:'Casa Playa Hueso',   tag:'Residencial · Viz 3D',    loc:'Lima',               cat:'residencial', size:'third'  },
  { n:'Casa Caballeriza',   tag:'Residencial · Viz 3D',    loc:'Lima',               cat:'residencial', size:'third'  },
  { n:'Alma Beauty Studio', tag:'Comercial',               loc:'Cajamarca',          cat:'comercial',   size:'wide'   },
  { n:'Doñary',             tag:'Comercial',               loc:'Cajamarca',          cat:'comercial',   size:'medium' },
  { n:'Orgánica Café',      tag:'Restaurante · Café',      loc:'Lambayeque',         cat:'comercial',   size:'large'  },
  { n:'Mitoz',              tag:'Comercial',               loc:'Cajamarca',          cat:'comercial',   size:'third'  },
  { n:'Tasca',              tag:'Restaurante · Bar',       loc:'Cajamarca',          cat:'comercial',   size:'third'  },
  { n:'Alegoría',           tag:'Comercial · Gastronomía', loc:'Cajamarca',          cat:'comercial',   size:'third'  },
];

const grid = document.getElementById('projectsGrid');
grid.innerHTML = PROYECTOS.map((p, i) => {
  const num = String(i + 1).padStart(2, '0');
  const media = p.img
    ? `<img class="project-img" src="${p.img}" alt="${p.n}" loading="lazy">`
    : `<div class="proj-ph"><div class="proj-ph-text">${num} / ${p.n}<small>${p.loc}</small></div></div>`;
  return `
    <article class="project-card ${p.size} reveal" data-cat="${p.cat}" data-i="${i}" tabindex="0">
      <div class="project-img-wrap">${media}
        <div class="project-overlay"><div class="project-overlay-content"><div class="overlay-view">Ver proyecto</div><div class="overlay-desc">${p.n}</div></div></div>
      </div>
      <span class="project-tag">${p.tag}</span>
      <h3 class="project-name">${p.n}</h3>
      <p class="project-location">${p.loc}, Perú</p>
    </article>`;
}).join('');

// Nav
const nav = document.getElementById('mainNav');
const navToggle = document.getElementById('navToggle');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('menu-open');
  navToggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('menu-open');
  navToggle.setAttribute('aria-expanded', false);
}));

// Reveal on scroll
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 70);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Filtros
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const f = tab.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      card.style.display = (f === 'all' || card.dataset.cat === f) ? '' : 'none';
    });
  });
});

// Lightbox
const lb = document.getElementById('lightbox');
function openLightbox(p) {
  document.getElementById('lbCaption').textContent = p.n;
  document.getElementById('lbTag').textContent = p.tag;
  document.getElementById('lbLoc').textContent = p.loc;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
}
grid.addEventListener('click', e => {
  const card = e.target.closest('.project-card');
  if (card) openLightbox(PROYECTOS[card.dataset.i]);
});
grid.addEventListener('keydown', e => {
  const card = e.target.closest('.project-card');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLightbox(PROYECTOS[card.dataset.i]); }
});
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// Formulario → abre el correo con el mensaje armado
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const n = document.getElementById('fNombre').value.trim();
  const em = document.getElementById('fEmail').value.trim();
  const t = document.getElementById('fTipo').value || 'Sin especificar';
  const m = document.getElementById('fMsg').value.trim();
  const subject = `Consulta web — ${t}`;
  const body = `Nombre: ${n}\nEmail: ${em}\nTipo de proyecto: ${t}\n\n${m}`;
  window.location.href = `mailto:age.arquitec@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('uiToggle').addEventListener('click', () =>
  document.getElementById('viewerUi').classList.toggle('open'));
