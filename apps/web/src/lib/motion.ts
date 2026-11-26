/**
 * Lightweight motion layer (no dependencies):
 *  - [data-reveal]       fade/slide in when entering the viewport
 *  - [data-split]        split a heading into words and stagger them in
 *  - [data-parallax=n]   translate on scroll by factor n (e.g. 0.15)
 *  - [data-progress]     sets --p (0..1) as the element scrolls through the viewport
 *  - [data-tilt]         subtle 3D tilt following the pointer (fine pointers only)
 * Everything is disabled under prefers-reduced-motion.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = part;
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !(child as HTMLElement).classList.contains('w')) {
        walk(child);
      }
    });
  };
  walk(el);
  el.querySelectorAll<HTMLElement>('.w').forEach((w, i) => w.style.setProperty('--i', String(i)));
  el.dataset.splitDone = '1';
}

const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }),
  { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
);

function init() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => { splitWords(el); io.observe(el); });
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => io.observe(el));
  if (reduce) return;

  const parallax = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  const progress = [...document.querySelectorAll<HTMLElement>('[data-progress]')];
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const f = parseFloat(el.dataset.parallax || '0.1');
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * f).toFixed(1)}px, 0)`;
    }
    for (const el of progress) {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / (r.height || 1)));
      el.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
        el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
