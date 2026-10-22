(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;

    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.textContent = isOpen ? 'Menu' : 'Fermer';
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  function initReveals() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    elements.forEach((element) => observer.observe(element));
  }

  function initMap() {
    const tile = document.querySelector('.map-tile');
    const caption = document.querySelector('.map-caption');
    const nodes = Array.from(document.querySelectorAll('.map-node'));
    if (!tile || !caption || !nodes.length) return;

    const show = (node) => {
      nodes.forEach((item) => item.classList.toggle('is-active', item === node));
      caption.innerHTML = '<strong>' + node.dataset.name + '</strong> · ' + node.dataset.role;
    };

    nodes.forEach((node) => {
      node.addEventListener('pointerenter', () => show(node));
      node.addEventListener('focus', () => show(node));
      node.addEventListener('click', () => show(node));
    });
  }

  function initParallax() {
    const mosaic = document.querySelector('.hero-mosaic');
    if (!mosaic || reduceMotion.matches) return;

    let frame = 0;
    const update = () => {
      const shift = Math.min(window.scrollY, 400) * -0.025;
      mosaic.style.setProperty('--shift', shift.toFixed(2) + 'px');
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  function init() {
    initMenu();
    initReveals();
    initMap();
    initParallax();
    window.__siteReady = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
