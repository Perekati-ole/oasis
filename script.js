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

// BAR CAROUSEL (stands)
const barTrack = document.getElementById('barTrack');
const barSlides = document.querySelectorAll('.bar-slide');
const barPrev = document.querySelector('.bar-carousel-arrow.left');
const barNext = document.querySelector('.bar-carousel-arrow.right');
const barCurrent = document.getElementById('barCurrent');
const barTotal = document.querySelector('.bar-carousel-total');

function getMostVisibleBarSlideIndex() {
  if (!barTrack || !barSlides.length) return 0;
  const trackRect = barTrack.getBoundingClientRect();
  let bestIndex = 0;
  let bestRatio = -1;

  barSlides.forEach((slide, i) => {
    const r = slide.getBoundingClientRect();
    const visibleLeft = Math.max(r.left, trackRect.left);
    const visibleRight = Math.min(r.right, trackRect.right);
    const visible = Math.max(0, visibleRight - visibleLeft);
    const ratio = visible / Math.max(1, r.width);

    if (ratio > bestRatio + 1e-6) {
      bestRatio = ratio;
      bestIndex = i;
      return;
    }

    if (Math.abs(ratio - bestRatio) < 1e-6 && i < bestIndex) {
      bestIndex = i;
    }
  });

  return bestIndex;
}

function updateBarIndexByScroll() {
  if (!barTrack || !barSlides.length || !barCurrent) return;
  const bestIndex = getMostVisibleBarSlideIndex();
  const pad = String(bestIndex + 1).padStart(2, '0');
  barCurrent.textContent = pad;
  return bestIndex;
}

function scrollBarToIndex(index) {
  if (!barTrack || !barSlides.length) return;
  const nextIndex = Math.max(0, Math.min(barSlides.length - 1, index));
  const slide = barSlides[nextIndex];
  const left = slide.offsetLeft - 56;
  barTrack.scrollTo({ left, behavior: 'smooth' });
  updateBarIndexByScroll();
}

if (barTrack && barSlides.length) {
  if (barTotal) barTotal.textContent = `/${String(barSlides.length).padStart(2, '0')}`;

  barTrack.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateBarIndexByScroll);
  }, { passive: true });

  // Replace placeholder behavior with dynamic based on current index.
  let currentIndex = 0;
  const updateCurrentIndex = () => {
    if (!barSlides.length) return;
    const best = updateBarIndexByScroll();
    currentIndex = typeof best === 'number' ? best : 0;
  };

  barTrack.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateCurrentIndex);
  }, { passive: true });

  if (barPrev) {
    barPrev.onclick = () => scrollBarToIndex(currentIndex - 1);
  }
  if (barNext) {
    barNext.onclick = () => scrollBarToIndex(currentIndex + 1);
  }

  updateCurrentIndex();
}

// GALLERY MODAL (clickable, swipe, prev/next)
const galleryModal = document.getElementById('galleryModal');
const galleryModalImg = document.getElementById('galleryModalImg');
const galleryModalTitle = document.getElementById('galleryModalTitle');
const galleryModalCounter = document.getElementById('galleryModalCounter');
const galleryModalClose = document.querySelector('.gallery-modal-close');
const galleryModalPrev = document.querySelector('.gallery-modal-nav.prev');
const galleryModalNext = document.querySelector('.gallery-modal-nav.next');
const galleryModalMedia = document.querySelector('.gallery-modal-media');
const galleryModalItems = document.querySelectorAll('.gallery-item[data-src]');

let currentGalleryIndex = 0;
let lastFocusedEl = null;

function openGalleryModal(index) {
  if (!galleryModal || !galleryModalImg || !galleryModalItems.length) return;
  lastFocusedEl = document.activeElement;
  currentGalleryIndex = Math.max(0, Math.min(galleryModalItems.length - 1, index));
  const item = galleryModalItems[currentGalleryIndex];

  const src = item.dataset.src;
  const title = item.dataset.title || item.querySelector('span')?.textContent || '';

  galleryModalImg.src = src;
  galleryModalImg.alt = title;
  galleryModalTitle.textContent = title;
  galleryModalCounter.textContent = `${currentGalleryIndex + 1}/${galleryModalItems.length}`;

  galleryModal.classList.add('is-open');
  galleryModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  if (!galleryModal) return;
  galleryModal.classList.remove('is-open');
  galleryModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

function nextGallery() {
  openGalleryModal(currentGalleryIndex + 1 >= galleryModalItems.length ? 0 : currentGalleryIndex + 1);
}

function prevGallery() {
  openGalleryModal(currentGalleryIndex - 1 < 0 ? galleryModalItems.length - 1 : currentGalleryIndex - 1);
}

if (galleryModalItems.length && galleryModalClose) {
  galleryModalItems.forEach((item, i) => {
    item.addEventListener('click', () => openGalleryModal(i));
  });

  galleryModalClose.addEventListener('click', closeGalleryModal);
  if (galleryModalPrev) galleryModalPrev.addEventListener('click', prevGallery);
  if (galleryModalNext) galleryModalNext.addEventListener('click', nextGallery);

  window.addEventListener('keydown', (e) => {
    const isOpen = galleryModal.classList.contains('is-open');
    if (!isOpen) return;
    if (e.key === 'Escape') closeGalleryModal();
    if (e.key === 'ArrowLeft') prevGallery();
    if (e.key === 'ArrowRight') nextGallery();
  });

  if (galleryModalMedia) {
    let startX = 0;
    galleryModalMedia.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches.length) return;
      startX = e.touches[0].clientX;
    }, { passive: true });

    galleryModalMedia.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - startX;
      const threshold = 45;
      if (Math.abs(dx) < threshold) return;
      if (dx < 0) nextGallery();
      else prevGallery();
    });
  }
}