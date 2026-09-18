/* CSeekers — Confirmación de sesión · JS de página
   (home-acos.js maneja nav scrolled y reveals) */
(function () {
  /* Checklist interactivo — estado SOLO en memoria (nota de implementación #3) */
  const items = document.querySelectorAll('.check-item');
  const counter = document.getElementById('prepCount');
  const doneMsg = document.getElementById('prepDone');
  function refresh() {
    const done = document.querySelectorAll('.check-item.done').length;
    if (counter) counter.textContent = done + '/4';
    if (doneMsg) doneMsg.classList.toggle('show', done === items.length);
  }
  items.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('done');
      const box = item.querySelector('[role="checkbox"]');
      if (box) box.setAttribute('aria-checked', String(item.classList.contains('done')));
      refresh();
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); item.click(); }
    });
  });
  refresh();

  /* VSL placeholder: click marca intención (el video real se conecta después) */
  const vsl = document.getElementById('vsl');
  if (vsl) {
    vsl.addEventListener('click', () => {
      const label = vsl.querySelector('.poster-label');
      if (label) label.textContent = 'VIDEO PENDIENTE DE CONECTAR — SUSTITUIR ESTE EMBED';
    });
  }
})();
