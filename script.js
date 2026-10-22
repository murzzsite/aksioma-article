(() => {
  const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/G8XGHJ7L5D';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.getElementById('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
  }));

  // выбор тарифа подставляется в форму
  const formatSelect = document.getElementById('formatSelect');
  document.querySelectorAll('[data-plan]').forEach(a => a.addEventListener('click', () => {
    if (formatSelect) formatSelect.value = a.dataset.plan;
  }));

  const form = document.getElementById('leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });

    if (payload._gotcha) return;

    if (!payload.name || (!payload.phone && !payload.contact)) {
      alert('Заполните имя и контактные данные');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена ✓';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ===== Схема осанки: два положения, плавный переход между ними =====
  const $ = id => document.getElementById(id);
  const slouch = { hip: [176, 262], knee: [208, 384], ank: [200, 504], sho: [228, 160], ctl: [150, 215], head: [292, 112], elb: [246, 228], hand: [262, 296] };
  const upright = { hip: [200, 262], knee: [200, 384], ank: [200, 504], sho: [200, 150], ctl: [200, 205], head: [200, 82], elb: [204, 222], hand: [212, 296] };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (k, t) => [lerp(slouch[k][0], upright[k][0], t), lerp(slouch[k][1], upright[k][1], t)];

  const draw = t => {
    const hip = mix('hip', t), knee = mix('knee', t), ank = mix('ank', t), sho = mix('sho', t);
    const ctl = mix('ctl', t), head = mix('head', t), elb = mix('elb', t), hand = mix('hand', t);
    $('spine').setAttribute('d', `M${hip[0]} ${hip[1]} Q${ctl[0]} ${ctl[1]} ${sho[0]} ${sho[1]}`);
    const set = (id, a, b) => { const l = $(id); l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]); };
    set('legU', hip, knee); set('legL', knee, ank);
    $('arm').setAttribute('d', `M${sho[0]} ${sho[1]} L${elb[0]} ${elb[1]} L${hand[0]} ${hand[1]}`);
    const nk = [sho[0] + (head[0] - sho[0]) * 0.55, sho[1] + (head[1] - sho[1]) * 0.55];
    set('neck', sho, nk);
    $('head').setAttribute('cx', head[0]); $('head').setAttribute('cy', head[1]);
    set('axis', hip, head);
    [['jHip', hip], ['jSho', sho], ['jHead', head]].forEach(([id, p]) => { $(id).setAttribute('cx', p[0]); $(id).setAttribute('cy', p[1]); });
    const deg = Math.round(Math.atan2(Math.abs(head[0] - hip[0]), hip[1] - head[1]) * 180 / Math.PI);
    $('angle').textContent = deg + '°';
    $('angleLabel').textContent = deg > 3 ? 'наклон головы вперёд' : 'голова над опорой';
  };

  let cur = 0, raf = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setPressed = up => {
    $('btnSlouch').setAttribute('aria-pressed', String(!up));
    $('btnUpright').setAttribute('aria-pressed', String(up));
  };
  const go = (to, dur = 1100) => {
    cancelAnimationFrame(raf);
    setPressed(to === 1);
    if (reduce) { cur = to; draw(cur); return; }
    const from = cur, start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / dur);
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      cur = lerp(from, to, e);
      draw(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  if ($('figure')) {
    draw(0);
    $('btnSlouch').addEventListener('click', () => go(0));
    $('btnUpright').addEventListener('click', () => go(1));
    // единственная анимация на загрузке: схема выпрямляется
    setTimeout(() => go(1, 1500), 900);
  }
})();
