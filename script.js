/* ─────────────────────────────────────────────
   B4 Portfolio — Vanilla JavaScript
   ───────────────────────────────────────────── */
(function () {
  'use strict';

  const ASSETS   = 'assets/';
  const MANIFEST = ASSETS + 'manifest.json';

  // ─── DOM refs ───
  const gallery   = document.getElementById('gallery');
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lbImg');
  const lbContent = document.getElementById('lbContent');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');
  const lbCounter = document.getElementById('lbCounter');
  const backToTop = document.getElementById('backToTop');

  // Lightbox state
  let lbImages = [];   // array of image src strings (excludes videos)
  let lbIndex  = -1;

  /* ══════════════════════════════════════════
     Initialisation
     ══════════════════════════════════════════ */
  async function init() {
    try {
      const res = await fetch(MANIFEST + '?t=' + Date.now());
      if (!res.ok) throw new Error(res.status);
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        showEmptyState();
        return;
      }
      buildGallery(items);
      setupObserver();
      setupLightbox();
      setupBackToTop();
    } catch (_) {
      showEmptyState();
    }
  }

  /* ══════════════════════════════════════════
     Grouping Logic
     ──────────────────────────────────────────
     Files named  03a-…  03b-…  share the
     numeric prefix "03" and get placed in a
     two-column row. Everything else is a
     single full-width item.
     ══════════════════════════════════════════ */
  function groupItems(items) {
    const groups = [];
    let i = 0;

    while (i < items.length) {
      // Does filename start with digits + a letter?  e.g. 03a-
      const m = items[i].file.match(/^(\d+)([a-z])/i);

      if (m) {
        const prefix = m[1];
        const group  = [items[i]];
        let j = i + 1;

        // Collect consecutive items with the same numeric prefix
        while (j < items.length) {
          const mNext = items[j].file.match(/^(\d+)([a-z])/i);
          if (mNext && mNext[1] === prefix) {
            group.push(items[j]);
            j++;
          } else {
            break;
          }
        }

        if (group.length >= 2) {
          groups.push({ kind: 'pair', items: group });
        } else {
          groups.push({ kind: 'single', item: items[i] });
        }
        i = j;
      } else {
        groups.push({ kind: 'single', item: items[i] });
        i++;
      }
    }
    return groups;
  }

  /* ══════════════════════════════════════════
     Build Gallery DOM
     ══════════════════════════════════════════ */
  function buildGallery(items) {
    const groups = groupItems(items);

    groups.forEach(function (g) {
      if (g.kind === 'pair') {
        // ── Two-column row ──
        var row = document.createElement('div');
        row.className = 'media-row';

        g.items.forEach(function (item) {
          var cell = document.createElement('div');
          cell.className = 'media-cell';
          cell.appendChild(createMediaElement(item));
          row.appendChild(cell);
        });

        gallery.appendChild(row);
      } else {
        // ── Single full-width item ──
        var wrapper = document.createElement('div');
        wrapper.className = 'media-item';
        wrapper.appendChild(createMediaElement(g.item));
        gallery.appendChild(wrapper);
      }
    });
  }

  /* ── Create <img> or <video> ── */
  function createMediaElement(item) {
    var src = ASSETS + item.file;

    if (item.type === 'video') {
      var video = document.createElement('video');
      video.src          = src;
      video.autoplay     = true;
      video.muted        = true;
      video.loop         = true;
      video.playsInline  = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('preload', 'auto');
      return video;
    }

    // Image / GIF
    var idx = lbImages.length;
    lbImages.push(src);

    var img = document.createElement('img');
    img.src              = src;
    img.alt              = item.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    img.loading          = 'lazy';
    img.decoding         = 'async';
    img.dataset.lbIndex  = idx;
    img.addEventListener('click', function () { openLightbox(idx); });
    return img;
  }

  /* ══════════════════════════════════════════
     Intersection Observer  –  fade-in
     ══════════════════════════════════════════ */
  function setupObserver() {
    var delay = 0;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger items that enter on first paint
          var el = entry.target;
          var d  = delay;
          delay += 80;
          setTimeout(function () { el.classList.add('visible'); }, d);
          observer.unobserve(el);
        }
      });
      // Reset stagger after the first batch
      setTimeout(function () { delay = 0; }, 400);
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    var nodes = gallery.querySelectorAll('.media-item, .media-row');
    for (var i = 0; i < nodes.length; i++) {
      observer.observe(nodes[i]);
    }
  }

  /* ══════════════════════════════════════════
     Lightbox
     ══════════════════════════════════════════ */
  function setupLightbox() {
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', function () { navigateLB(-1); });
    lbNext.addEventListener('click', function () { navigateLB(1); });

    // Click backdrop to close
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lbContent) {
        closeLightbox();
      }
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      switch (e.key) {
        case 'Escape':     closeLightbox(); break;
        case 'ArrowLeft':  navigateLB(-1);  break;
        case 'ArrowRight': navigateLB(1);   break;
      }
    });

    // Swipe support (mobile)
    var startX = 0;
    lbContent.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });
    lbContent.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 50) navigateLB(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function openLightbox(index) {
    lbIndex = index;
    showLBImage(index);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lbIndex = -1;
  }

  function navigateLB(dir) {
    var next = lbIndex + dir;
    if (next < 0 || next >= lbImages.length) return;
    lbIndex = next;

    // Quick cross-fade
    lbImg.style.opacity = 0;
    setTimeout(function () {
      showLBImage(next);
      lbImg.style.opacity = 1;
    }, 180);
  }

  function showLBImage(index) {
    lbImg.src = lbImages[index];
    lbPrev.style.display = index > 0 ? '' : 'none';
    lbNext.style.display = index < lbImages.length - 1 ? '' : 'none';
    lbCounter.textContent = (index + 1) + ' / ' + lbImages.length;
  }

  /* ══════════════════════════════════════════
     Back-to-Top Button
     ══════════════════════════════════════════ */
  function setupBackToTop() {
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          backToTop.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════
     Empty / Error State
     ══════════════════════════════════════════ */
  function showEmptyState() {
    gallery.innerHTML =
      '<div class="empty-state">' +
        '<h2>No media found</h2>' +
        '<p>' +
          '1. Drop your images, GIFs, and videos into the <strong>assets/</strong> folder.<br>' +
          '2. Run <code>node generate-manifest.js</code> or <code>.\\generate-manifest.ps1</code><br>' +
          '3. Refresh this page.' +
        '</p>' +
      '</div>';
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', init);
})();
