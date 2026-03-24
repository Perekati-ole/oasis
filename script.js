// простая плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior:'smooth'
    });
  });
});

const slider = document.getElementById('slider');
const rightArrow = document.querySelector('.arrow.right');
const leftArrow = document.querySelector('.arrow.left');
const galleryItems = document.querySelectorAll('.gallery-item');
const processItems = document.querySelectorAll('.process-item');

if (slider && rightArrow && leftArrow) {
  rightArrow.onclick = () => {
    slider.scrollBy({ left: 300, behavior: 'smooth' });
  };

  leftArrow.onclick = () => {
    slider.scrollBy({ left: -300, behavior: 'smooth' });
  };
}

const scrollLine = document.querySelector('.scroll-line');
const warmSection = document.querySelector('.warm');
const siteHeader = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.main-nav a');

function mixChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mixColor(cold, warm, t) {
  const r = mixChannel(cold[0], warm[0], t);
  const g = mixChannel(cold[1], warm[1], t);
  const b = mixChannel(cold[2], warm[2], t);
  return `rgb(${r}, ${g}, ${b})`;
}

function updateScrollLine() {
  if (!scrollLine) return;

  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;

  const coldRgb = [140, 167, 191];
  const warmRgb = [184, 145, 95];
  let warmth = 0;

  if (warmSection) {
    const triggerStart = warmSection.offsetTop - window.innerHeight * 0.45;
    const triggerEnd = warmSection.offsetTop + window.innerHeight * 0.55;
    const range = Math.max(1, triggerEnd - triggerStart);
    warmth = Math.min(1, Math.max(0, (window.scrollY - triggerStart) / range));
  }

  scrollLine.style.setProperty('--scroll-progress', progress.toFixed(2));
  scrollLine.style.setProperty('--scroll-color', mixColor(coldRgb, warmRgb, warmth));
}

window.addEventListener('scroll', updateScrollLine, { passive: true });
window.addEventListener('resize', updateScrollLine);
updateScrollLine();

if (siteHeader && navToggle) {
  navToggle.addEventListener('click', () => {
    const opened = siteHeader.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(opened));
    navToggle.textContent = opened ? '✕' : '☰';
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (!siteHeader || !navToggle) return;
    siteHeader.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.textContent = '☰';
  });
});

if (galleryItems.length) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  galleryItems.forEach(item => revealObserver.observe(item));
}

if (processItems.length) {
  const processObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.22, rootMargin: '0px 0px -8% 0px' });

  processItems.forEach(item => processObserver.observe(item));
}