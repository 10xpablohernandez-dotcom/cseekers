/* CSeekers — Home Protocolo ACOS · interacciones y animaciones */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scrolled ---------- */
  const nav = document.getElementById('topnav');
  const onScrollNav = () => {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Mobile sheet ---------- */
  const navBurger = document.getElementById('navBurger');
  const sheetClose = document.getElementById('sheetClose');
  const sheetBackdrop = document.getElementById('sheetBackdrop');
  const mobileSheet = document.getElementById('mobileSheet');
  function setSheet(open) {
    document.body.classList.toggle('sheet-open', open);
    if (mobileSheet) mobileSheet.setAttribute('aria-hidden', String(!open));
  }
  if (navBurger && mobileSheet) {
    navBurger.addEventListener('click', () => setSheet(true));
    sheetClose.addEventListener('click', () => setSheet(false));
    sheetBackdrop.addEventListener('click', () => setSheet(false));
    mobileSheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setSheet(false)));
  }

  /* ---------- Reveal on scroll (fade + 12px, 400ms) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .uline, .marker, .path, .spark, .icp-yes').forEach(el => io.observe(el));

  /* ---------- Kicker typing (una sola vez, 1.2s) ---------- */
  const kicker = document.getElementById('heroKicker');
  if (kicker) {
    const text = kicker.dataset.text || '';
    const target = kicker.querySelector('.txt');
    if (reduced) {
      target.textContent = text;
      kicker.classList.add('done');
    } else {
      const step = 1200 / text.length;
      let i = 0;
      const t = setInterval(() => {
        target.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(t); setTimeout(() => kicker.classList.add('done'), 600); }
      }, step);
    }
  }

  /* ---------- Count-ups ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1200;
    const fmt = (v) => prefix + v.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reduced) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = fmt(target); el.classList.add(el.dataset.glowClass || 'glow'); el.dispatchEvent(new CustomEvent('countdone')); }
    }
    requestAnimationFrame(frame);
  }
  const ioCount = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); ioCount.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-target]').forEach(el => ioCount.observe(el));

  /* ---------- Math block: rojo → verde ---------- */
  const mathNum = document.getElementById('mathNum');
  if (mathNum) mathNum.addEventListener('countdone', () => mathNum.classList.add('ok'));

  /* ---------- Camino: línea + nodos en secuencia ---------- */
  const path = document.querySelector('.path');
  if (path) {
    const ioPath = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        ioPath.unobserve(path);
        const nodes = path.querySelectorAll('.path-node');
        nodes.forEach((n, i) => {
          setTimeout(() => {
            n.classList.add('lit');
            if (i === 0) n.classList.add('hot'); /* glow permanente en el paso 1 */
          }, reduced ? 0 : 400 + i * 350);
        });
      });
    }, { threshold: 0.3 });
    ioPath.observe(path);
  }

  /* ---------- Stack: filas → tachado → pulso de precio ---------- */
  const stack = document.querySelector('.stack');
  if (stack) {
    const ioStack = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        ioStack.unobserve(stack);
        const rows = stack.querySelectorAll('.stack-row');
        rows.forEach((r, i) => {
          setTimeout(() => {
            r.classList.add('shown');
            if (r.classList.contains('total')) {
              setTimeout(() => {
                r.classList.add('struck');
                const price = document.querySelector('.offer-price .new');
                if (price) setTimeout(() => price.classList.add('pulse'), 500);
              }, 400);
            }
          }, reduced ? 0 : i * 160);
        });
      });
    }, { threshold: 0.3 });
    ioStack.observe(stack);
  }

  /* ---------- Mecanismo único: barras animadas al entrar en viewport ---------- */
  const stage = document.getElementById('mechStage');
  if (stage) {
    const SALE = 1000;
    const COSTS = [450, 120, 85, 135, 250]; /* producto, envío, comisión, devoluciones, pauta */
    const segs = stage.querySelectorAll('.bar-roas .seg.cost');
    const rest = stage.querySelector('.bar-roas .seg.rest');
    const remEl = stage.querySelector('.bar-roas-title .rem');
    const items = stage.querySelectorAll('.mech-costs li');
    const contrib = stage.querySelector('.mech-contrib');
    const verdict = stage.querySelector('.mech-verdict');
    const money = (v) => (v < 0 ? '−$' + Math.abs(v) : '$' + v);

    function setStep(step) {
      let remaining = SALE;
      for (let i = 0; i < COSTS.length; i++) {
        const gone = i < step;
        segs[i] && segs[i].classList.toggle('gone', gone);
        items[i] && items[i].classList.toggle('on', gone);
        if (gone) remaining -= COSTS[i];
      }
      if (remEl) {
        remEl.textContent = 'QUEDA: ' + money(remaining);
        remEl.classList.toggle('neg', remaining < 0);
      }
      if (rest) rest.classList.toggle('neg', remaining < 0);
      const final = step >= COSTS.length;
      contrib && contrib.classList.toggle('show', final);
      verdict && verdict.classList.toggle('show', final);
    }

    if (reduced) {
      setStep(COSTS.length);
    } else {
      const ioMech = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          ioMech.unobserve(stage);
          let step = 0;
          const t = setInterval(() => {
            setStep(++step);
            if (step >= COSTS.length) clearInterval(t);
          }, 650);
        });
      }, { threshold: 0.5 });
      ioMech.observe(stage);
    }
  }

  /* ---------- FAQ accordion (single-open) ---------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      faqItems.forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = '0px';
      });
      if (willOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
})();
