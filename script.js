import * as THREE from 'three';

const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/G8XGHJ7L5D';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 900;
const hasGsap = !!(window.gsap && window.ScrollTrigger);
if (!hasGsap) document.documentElement.classList.remove('anim');

/* ---------- базовые вещи ---------- */
$('#year').textContent = new Date().getFullYear();
const header = $('#header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = $('#burger'), nav = $('#nav');
burger.addEventListener('click', () => { burger.classList.toggle('is-open'); nav.classList.toggle('is-open'); });
$$('a', nav).forEach(a => a.addEventListener('click', () => { burger.classList.remove('is-open'); nav.classList.remove('is-open'); }));

/* ---------- форма ---------- */
const form = $('#leadForm');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('button[type="submit"]', form);
  const orig = btn.textContent;
  const payload = {};
  new FormData(form).forEach((v, k) => { payload[k] = v; });
  if (payload._gotcha) return;
  if (!payload.name || (!payload.phone && !payload.contact)) { alert('Заполните имя и контактные данные'); return; }
  btn.disabled = true; btn.textContent = 'Отправляем...';
  try {
    const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    btn.textContent = 'Заявка отправлена ✓'; form.reset();
  } catch (err) {
    console.error(err); btn.textContent = 'Ошибка, попробуйте ещё раз';
  } finally {
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
  }
});

/* ---------- каталог: вкладки ---------- */
const tabs = $$('.map__tabs [role="tab"]');
const panels = $$('.map__panels .panel');
const selectTab = (i, focus) => {
  tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
  panels.forEach((p, k) => { p.hidden = k !== i; });
  if (focus) tabs[i].focus();
  if (hasGsap && !reduce) gsap.fromTo($$('li', panels[i]), { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: .5, stagger: .06, ease: 'power3.out' });
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(i));
  t.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); selectTab((i + 1) % tabs.length, true); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); selectTab((i - 1 + tabs.length) % tabs.length, true); }
  });
});

/* ---------- матричный дождь (фон) ---------- */
const rain = $('#rain');
if (rain && !reduce) {
  const ctx = rain.getContext('2d');
  const glyphs = '01アイウエオカキクケコサシスセソ<>{}=+*';
  const size = 18;
  let cols = 0, drops = [], w = 0, h = 0, last = 0;
  const resize = () => {
    w = rain.width = innerWidth; h = rain.height = innerHeight;
    cols = Math.ceil(w / size);
    drops = Array.from({ length: cols }, () => Math.random() * -h / size);
  };
  resize();
  addEventListener('resize', resize);
  const frame = t => {
    requestAnimationFrame(frame);
    if (document.hidden || t - last < 55) return;
    last = t;
    ctx.fillStyle = 'rgba(5,11,26,.13)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = size + 'px "JetBrains Mono", monospace';
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = Math.random() > .97 ? '#D6FFE8' : '#2BFF88';
      ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, drops[i] * size);
      if (drops[i] * size > h && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
  };
  requestAnimationFrame(frame);
} else if (rain) {
  rain.style.display = 'none';
}

/* ---------- 3D: сфера из кода + оранжевые блоки ---------- */
const S = { x: 2.1, y: -0.1, s: 1, amp: 0.2, freq: 1.2, dim: 1, rot: 0 };
let renderOnce = () => {};

const noise = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vert = `
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform vec2 uMouse;
varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vD;
${noise}
void main(){
  vec3 n = normalize(position);
  float d = snoise(n*uFreq + vec3(uTime*.18, uTime*.12, uMouse.x*.6));
  d += .5*snoise(n*uFreq*2.1 - uTime*.2);
  vD = d;
  vec3 p = position + n*d*uAmp;
  vP = n;
  vec4 mv = modelViewMatrix*vec4(p,1.);
  vN = normalize(normalMatrix*n);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;

const frag = `
precision highp float;
uniform float uTime; uniform float uDim;
varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vD;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec3 n = normalize(vN);
  float fres = pow(1.-abs(dot(n,normalize(vV))), 2.4);
  float u = atan(vP.z,vP.x)/6.2831853+.5;
  float v = vP.y*.5+.5;
  float cols = 84., rows = 42.;
  vec2 id = vec2(floor(u*cols), floor(v*rows));
  vec2 f = fract(vec2(u*cols, v*rows));
  float h = hash(id.x);
  float head = fract(h*9. + uTime*(.12+h*.28));
  float t = fract(head - id.y/rows);
  float br = pow(1.-t, 7.);
  float glyph = step(abs(f.x-.5),.34)*step(abs(f.y-.5),.34);
  float flick = step(.45, hash2(id+floor(uTime*3.)));
  vec3 base = mix(vec3(.02,.05,.14), vec3(.04,.12,.30), v);
  vec3 green = vec3(.17,1.,.53);
  vec3 col = base + green*br*glyph*(.55+.45*flick)*1.25;
  float spark = step(.988, hash2(id*1.7)) * step(.05, br);
  col = mix(col, vec3(1.,.42,.1)*1.4, spark*glyph);
  col += green*fres*.55 + vec3(.05,.12,.3)*fres;
  col *= (.55 + .45*dot(n, normalize(vec3(.4,.7,.6)))*.5+.5*.5);
  col *= uDim;
  gl_FragColor = vec4(col,1.);
}`;

try {
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
  camera.position.z = 7;

  const group = new THREE.Group();
  scene.add(group);

  const uniforms = { uTime: { value: 0 }, uAmp: { value: S.amp }, uFreq: { value: S.freq }, uMouse: { value: new THREE.Vector2() }, uDim: { value: 1 } };
  const detail = isMobile() ? 24 : 44;
  const sphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, detail),
    new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag })
  );
  group.add(sphere);

  // оранжевые «блоки» на орбите
  const N = isMobile() ? 24 : 44;
  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff6a1a }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const r = 2.1 + Math.random() * 1.1, a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    pos.set(r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * .8, r * Math.sin(b) * Math.sin(a));
    e.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); q.setFromEuler(e);
    const k = .04 + Math.random() * .09; sc.set(k, k, k);
    m.compose(pos, q, sc); cubes.setMatrixAt(i, m);
  }
  const cubeGroup = new THREE.Group(); cubeGroup.add(cubes); group.add(cubeGroup);

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, cx: 0, cy: 0 };
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', ev => { mouse.x = ev.clientX / innerWidth * 2 - 1; mouse.y = -(ev.clientY / innerHeight * 2 - 1); });
  }

  const clock = new THREE.Clock();
  const draw = () => {
    const dt = clock.getDelta();
    mouse.cx += (mouse.x - mouse.cx) * .06; mouse.cy += (mouse.y - mouse.cy) * .06;
    uniforms.uTime.value += reduce ? 0 : dt;
    uniforms.uAmp.value = S.amp; uniforms.uFreq.value = S.freq; uniforms.uDim.value = S.dim;
    uniforms.uMouse.value.set(mouse.cx, mouse.cy);
    const mob = isMobile();
    group.position.set(mob ? 0 : S.x, mob ? S.y + 1.5 : S.y, 0);
    group.scale.setScalar(S.s * (mob ? .62 : 1));
    sphere.rotation.y += reduce ? 0 : dt * .12;
    sphere.rotation.x = mouse.cy * .25;
    cubeGroup.rotation.y -= reduce ? 0 : dt * .16;
    cubeGroup.rotation.x = .3 + mouse.cx * .2 + S.rot;
    renderer.render(scene, camera);
  };
  renderOnce = draw;
  if (reduce) { draw(); addEventListener('resize', draw); }
  else {
    const loop = () => { requestAnimationFrame(loop); if (!document.hidden) draw(); };
    loop();
  }
} catch (err) {
  console.warn('WebGL недоступен', err);
  $('#gl').style.display = 'none';
}

/* ---------- анимации ---------- */
if (hasGsap && !reduce) {
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', ev => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const target = $(href);
    if (!target) return;
    ev.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  }));

  // разбивка заголовков на слова в масках
  const splitWords = el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    return $$('.w > span', el);
  };

  // вступление героя
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: .2 })
    .to('.hero .mask > span', { yPercent: 0, y: 0, duration: 1.6, stagger: .12 })
    .from('.hero__kicker', { opacity: 0, x: -16, duration: .9 }, .3)
    .from('.hero__cta .btn', { clipPath: 'inset(0 100% 0 0)', duration: 1, stagger: .12 }, 1)
    .from('.hero__facts', { opacity: 0, duration: 1 }, 1.3);

  // заголовки секций: слова поднимаются из масок
  $$('.title:not(.manifest)').forEach(el => {
    const inner = splitWords(el);
    gsap.fromTo(inner, { yPercent: 112 }, { yPercent: 0, duration: 1.2, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // манифест: слова проявляются по скроллу
  const man = $('#manifest');
  if (man) {
    const words = man.textContent.trim().split(/\s+/);
    man.setAttribute('aria-label', man.textContent.trim());
    man.innerHTML = words.map(w => `<span class="mw" aria-hidden="true">${w}</span>`).join(' ');
    gsap.fromTo($$('.mw', man), { opacity: .16 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: man, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  }

  // диаграмма: узлы открываются с разной скоростью, линии бегут
  const dg = $('#diagram');
  gsap.set('.node', { clipPath: 'inset(0 100% 0 0)' });
  const dtl = gsap.timeline({ scrollTrigger: { trigger: dg, start: 'top 75%' } });
  dtl.to('.node--l', { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'expo.out' })
     .to('.node--r', { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'expo.out' }, .15)
     .to('.node--c', { clipPath: 'inset(0 0% 0 0)', duration: 1.8, ease: 'power4.inOut' }, .6);
  gsap.to('.dl', { strokeDashoffset: -140, ease: 'none', scrollTrigger: { trigger: dg, start: 'top bottom', end: 'bottom top', scrub: true } });

  gsap.from('.flow li', { clipPath: 'inset(0 0 100% 0)', duration: .9, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: '.flow', start: 'top 88%' } });

  // навыки и списки: линии выезжают, текст слегка догоняет
  [['.skills li', '.skills'], ['.shift__list li', '.shift__list']].forEach(([sel, trg]) => {
    gsap.from(sel, { clipPath: 'inset(0 0 100% 0)', y: 14, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: trg, start: 'top 82%' } });
  });
  gsap.from('.punch', { opacity: 0, y: 24, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.punch', start: 'top 88%' } });

  // статуи: открываются шторкой и плывут с параллаксом
  $$('.statue').forEach(f => {
    const img = $('img', f);
    gsap.fromTo(f, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'power4.inOut', scrollTrigger: { trigger: f, start: 'top 85%' } });
    gsap.fromTo(img, { scale: 1.2, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // оранжевый позвоночник: линия заполняется по скроллу
  gsap.to('#spineFill', { scaleY: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // бегущая лента статуй: скорость зависит от скорости скролла
  const track = $('#stripTrack');
  if (track) {
    let x = 0;
    gsap.ticker.add(() => {
      const half = track.scrollWidth / 2;
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      x -= .55 + v * .5;
      if (-x >= half) x += half;
      gsap.set(track, { x });
    });
  }

  // магнитные кнопки (только мышь)
  if (matchMedia('(pointer: fine)').matches) {
    $$('[data-magnet]').forEach(b => {
      const qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3.out' });
      const qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3.out' });
      b.addEventListener('pointermove', ev => {
        const r = b.getBoundingClientRect();
        qx((ev.clientX - (r.left + r.width / 2)) * .25);
        qy((ev.clientY - (r.top + r.height / 2)) * .35);
      });
      b.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  // сфера переезжает между секциями
  const mob = isMobile();
  const states = {
    hero:     { x: 2.1,  y: -0.1, s: 1,   amp: .2,  freq: 1.2, dim: 1,   rot: 0 },
    approach: { x: 4.4,  y: -0.6, s: .8,  amp: .12, freq: 1.6, dim: .5,  rot: .4 },
    develops: { x: -4.5, y: 0.7,  s: .9,  amp: .28, freq: .9,  dim: .45, rot: -.3 },
    catalog:  { x: 4.7,  y: 1.9,  s: .55, amp: .08, freq: 2.2, dim: .4,  rot: .2 },
    shift:    { x: 4.4,  y: -0.2, s: .95, amp: .3,  freq: 1.1, dim: .55, rot: .6 },
    access:   { x: -4.2, y: -0.4, s: 1.05, amp: .22, freq: 1.4, dim: .55, rot: 0 }
  };
  Object.keys(states).forEach(k => {
    if (k === 'hero') return;
    const el = $(`[data-scene="${k}"]`);
    if (!el) return;
    const to = { ...states[k] };
    if (mob) { to.dim = Math.min(to.dim, .35); }
    gsap.to(S, { ...to, ease: 'none', immediateRender: false, scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 30%', scrub: 1.1 } });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
}
