/* CSeekers — Cronograma del Diagnóstico · JS de página
   (home-acos.js ya maneja nav, sheet, reveals, count-ups y FAQ) */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Elementos con clase .in al entrar (tachados, glow) */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  document.querySelectorAll('.strike16, .glow10, .credit').forEach(el => io.observe(el));

  /* Timeline: línea que se dibuja con el scroll + nodos que se encienden */
  const tl = document.querySelector('.tl-wrap');
  const fill = document.querySelector('.tl-fill');
  if (tl && fill) {
    const update = () => {
      const r = tl.getBoundingClientRect();
      const anchor = window.innerHeight * 0.62;
      const p = Math.min(1, Math.max(0, (anchor - r.top) / r.height));
      fill.style.height = (p * 100) + '%';
    };
    if (reduced) { fill.style.height = '100%'; }
    else { window.addEventListener('scroll', update, { passive: true }); update(); }

    const ioTl = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lit'); ioTl.unobserve(e.target); } });
    }, { threshold: 0.45 });
    document.querySelectorAll('.tl-item').forEach(item => {
      if (reduced) item.classList.add('lit'); else ioTl.observe(item);
    });
  }

  /* Condiciones de Ads Engine: typing en secuencia */
  const conds = document.querySelectorAll('.cond-line');
  if (conds.length) {
    if (reduced) {
      conds.forEach(c => { c.querySelector('.txt').textContent = c.dataset.text; c.classList.add('done'); });
    } else {
      const ioC = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          ioC.unobserve(e.target.parentElement ? e.target : e.target);
          conds.forEach(c => ioC.unobserve(c));
          let idx = 0;
          function typeLine() {
            if (idx >= conds.length) return;
            const line = conds[idx];
            const text = line.dataset.text;
            const target = line.querySelector('.txt');
            let i = 0;
            const step = Math.max(12, 900 / text.length);
            const t = setInterval(() => {
              target.textContent = text.slice(0, ++i);
              if (i >= text.length) { clearInterval(t); line.classList.add('done'); idx++; typeLine(); }
            }, step);
          }
          typeLine();
        });
      }, { threshold: 0.6 });
      ioC.observe(conds[0]);
    }
  }

  /* Círculos de tiempo (45/20/60 min sobre base 60) */
  const rings = document.querySelectorAll('.ring-fill');
  if (rings.length) {
    const ioR = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        ioR.unobserve(e.target);
        const c = 2 * Math.PI * 26; /* r=26 */
        const frac = Math.min(1, parseFloat(e.target.dataset.mins) / 60);
        e.target.style.strokeDashoffset = c * (1 - frac);
      });
    }, { threshold: 0.6 });
    rings.forEach(r => {
      const c = 2 * Math.PI * 26;
      r.style.strokeDasharray = c;
      r.style.strokeDashoffset = reduced ? c * (1 - Math.min(1, parseFloat(r.dataset.mins) / 60)) : c;
      if (!reduced) ioR.observe(r);
    });
  }
})();
