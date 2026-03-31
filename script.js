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

// BAR CAROUSEL: бесконечный loop, ПК/планшет 2–3 карточки + стрелки, мобилка 1 + свайп, без автолистания
const barCarousel = document.getElementById('barCarousel');
const barViewport = document.getElementById('barViewport');
const barTrack = document.getElementById('barTrack');
const barPrev = document.querySelector('.bar-carousel-arrow.left');
const barNext = document.querySelector('.bar-carousel-arrow.right');
const barCurrent = document.getElementById('barCurrent');
const barTotal = document.querySelector('.bar-carousel-total');

const BAR_GAP = 16;

function initBarCarousel() {
  if (!barTrack || !barViewport) return;

  const originals = Array.from(barTrack.querySelectorAll('.bar-slide'));
  if (!originals.length) return;

  const n = originals.length;
  barTrack.innerHTML = '';
  for (let g = 0; g < 3; g += 1) {
    originals.forEach((orig) => {
      const node = orig.cloneNode(true);
      if (g !== 1) node.setAttribute('aria-hidden', 'true');
      barTrack.appendChild(node);
    });
  }

  const slides = Array.from(barTrack.querySelectorAll('.bar-slide'));
  if (barTotal) barTotal.textContent = `/${String(n).padStart(2, '0')}`;

  let index = n;
  let isAnimating = false;

  function slideWidthPx() {
    const vw = barViewport.getBoundingClientRect().width;
    const iw = window.innerWidth;
    if (iw <= 900) {
      /* Почти на всю ширину — соседи едва заметны по краям */
      return Math.min(520, Math.max(220, Math.round(vw * 0.94)));
    }
    if (iw <= 1199) {
      return Math.max(200, Math.round((vw - BAR_GAP) / 2));
    }
    return Math.max(200, Math.round((vw - 2 * BAR_GAP) / 3));
  }

  let cachedSlideW = null;

  function layoutSlides() {
    const w = slideWidthPx();
    if (cachedSlideW !== null && Math.abs(w - cachedSlideW) < 0.5) return;
    cachedSlideW = w;
    slides.forEach((s) => {
      s.style.flex = `0 0 ${w}px`;
      s.style.width = `${w}px`;
    });
  }

  function updateIndicator() {
    if (!barCurrent) return;
    const real = ((index % n) + n) % n;
    barCurrent.textContent = String(real + 1).padStart(2, '0');
  }

  function updateActiveClasses() {
    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-side-left', 'is-side-right');
      if (i === index) s.classList.add('is-active');
      else if (i === index - 1) s.classList.add('is-side-left');
      else if (i === index + 1) s.classList.add('is-side-right');
    });
  }

  function updateTranslate(instant, loopJump) {
    layoutSlides();
    const slide = slides[index];
    if (!slide) return;

    const w = slideWidthPx();
    const slideCenter = index * (w + BAR_GAP) + w / 2;
    const vw = barViewport.getBoundingClientRect().width;
    const tx = vw / 2 - slideCenter;

    if (instant && loopJump && barCarousel) barCarousel.classList.add('bar-carousel--jump');

    if (instant) barTrack.classList.add('is-instant');
    barTrack.style.transform = `translateX(${tx}px)`;
    if (instant) {
      void barTrack.offsetHeight;
      barTrack.classList.remove('is-instant');
    }
    updateActiveClasses();
    updateIndicator();

    if (instant && loopJump && barCarousel) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          barCarousel.classList.remove('bar-carousel--jump');
        });
      });
    }
  }

  function handleLoop() {
    if (index >= n * 2) {
      index -= n;
      updateTranslate(true, true);
    } else if (index < n) {
      index += n;
      updateTranslate(true, true);
    }
  }

  let animEndTimer = null;

  function finishBarAnim() {
    if (!isAnimating) return;
    handleLoop();
    isAnimating = false;
    syncArrows();
    if (animEndTimer) {
      clearTimeout(animEndTimer);
      animEndTimer = null;
    }
  }

  function goNext() {
    if (isAnimating) return;
    isAnimating = true;
    syncArrows();
    index += 1;
    updateTranslate(false);
    if (animEndTimer) clearTimeout(animEndTimer);
    animEndTimer = window.setTimeout(finishBarAnim, 900);
  }

  function goPrev() {
    if (isAnimating) return;
    isAnimating = true;
    syncArrows();
    index -= 1;
    updateTranslate(false);
    if (animEndTimer) clearTimeout(animEndTimer);
    animEndTimer = window.setTimeout(finishBarAnim, 900);
  }

  function syncArrows() {
    if (barPrev) barPrev.disabled = isAnimating;
    if (barNext) barNext.disabled = isAnimating;
  }

  barTrack.addEventListener('transitionend', (e) => {
    if (e.target !== barTrack) return;
    const prop = e.propertyName || '';
    if (!prop.toLowerCase().includes('transform')) return;
    if (!isAnimating) return;
    finishBarAnim();
  });

  barTrack.addEventListener('transitioncancel', () => {
    if (!isAnimating) return;
    finishBarAnim();
  });

  if (barPrev) barPrev.addEventListener('click', () => goPrev());
  if (barNext) barNext.addEventListener('click', () => goNext());

  let touchStartX = 0;
  barViewport.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  barViewport.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    { passive: true }
  );

  if (barCarousel) {
    barCarousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    });
  }

  const ro = new ResizeObserver(() => {
    cachedSlideW = null;
    updateTranslate(true);
  });
  ro.observe(barViewport);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateTranslate(true);
      syncArrows();
    });
  });
}

initBarCarousel();

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