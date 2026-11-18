/** Aparición al hacer scroll para elementos con .reveal */
export function initReveal(root = document) {
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add('is-in'), i * 80);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  root.querySelectorAll('.reveal:not(.is-in)').forEach(el => io.observe(el));
}

/** Contadores animados para [data-count]. data-pad → 2 dígitos. */
export function initCounters() {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target;
      const end = +el.dataset.count;
      const start = el.hasAttribute('data-plain') ? end - 20 : 0;
      const pad = el.hasAttribute('data-pad');
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        const v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
        el.textContent = pad ? String(v).padStart(2, '0') : v;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

/** Inclinación 3D + brillo siguiendo el puntero (sólo mouse, no táctil). */
export function initTilt(selector) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', e => {
    const card = e.target.closest(selector);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg) translateY(-4px)`;
    card.style.setProperty('--gx', `${x * 100}%`);
    card.style.setProperty('--gy', `${y * 100}%`);
  });
  document.addEventListener('pointerout', e => {
    const card = e.target.closest(selector);
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}
