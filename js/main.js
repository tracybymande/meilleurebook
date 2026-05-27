// ── Année dynamique dans le footer ──
document.getElementById('year').textContent = new Date().getFullYear();

// ── Header shadow au scroll ──
window.addEventListener('scroll', () => {
  document.querySelector('.header').classList.toggle('scrolled', window.scrollY > 10);
});

// ── Menu burger (mobile) ──
const burger = document.getElementById('burger');
const nav    = document.getElementById('nav');
burger.addEventListener('click', () => {
  nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', nav.classList.contains('open'));
});
// Fermer le menu en cliquant sur un lien nav
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// ── Filtres catalogue ──
const filterBtns = document.querySelectorAll('.filter-btn');
const cards      = document.querySelectorAll('.book-card');
const noResults  = document.getElementById('no-results');

let activeCategory = 'tous';

function applyFilters() {
  let visible = 0;
  cards.forEach(card => {
    const show = activeCategory === 'tous' || card.dataset.category === activeCategory;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  noResults.style.display = visible === 0 ? 'block' : 'none';
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.filter;
    applyFilters();
  });
});

// ── Scroll animation légère (Intersection Observer) ──
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.12 }
);
document.querySelectorAll('.book-card, .contact-card, .apropos__text').forEach(el => {
  el.style.opacity  = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});
// Déclencher l'animation quand visible
const styleTag = document.createElement('style');
styleTag.textContent = '.visible { opacity: 1 !important; transform: none !important; }';
document.head.appendChild(styleTag);
