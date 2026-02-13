/**
 * VitaView AI - Landing Page Interactivity (Vanilla JS)
 * Substitui React state + Framer Motion por JS puro (~3KB)
 */
(function () {
  'use strict';

  // =============================================
  // 1. Intersection Observer - Scroll Animations
  // =============================================
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Animar chart bars dentro do elemento
        var bars = entry.target.querySelectorAll('.chart-bar');
        bars.forEach(function (bar) {
          bar.classList.add('visible');
        });
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '-50px 0px'
  });

  // Observar todos os elementos com animação de scroll
  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    observer.observe(el);
  });

  // =============================================
  // 2. Scroll-to-Top Button
  // =============================================
  var scrollBtn = document.getElementById('scroll-to-top');
  if (scrollBtn) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =============================================
  // 3. Mobile Menu Toggle
  // =============================================
  var menuBtn = document.getElementById('mobile-menu-btn');
  var menuClose = document.getElementById('mobile-menu-close');
  var menuOverlay = document.getElementById('mobile-menu-overlay');
  var menuPanel = document.getElementById('mobile-menu-panel');
  var menuBackdrop = document.getElementById('mobile-menu-backdrop');

  function openMenu() {
    if (menuOverlay) menuOverlay.classList.add('open');
    if (menuPanel) menuPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (menuOverlay) menuOverlay.classList.remove('open');
    if (menuPanel) menuPanel.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);

  // Fechar menu ao clicar em links
  if (menuPanel) {
    menuPanel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // =============================================
  // 4. Cookie Consent Banner
  // =============================================
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAccept = document.getElementById('cookie-accept');
  var cookieReject = document.getElementById('cookie-reject');

  function dismissCookies() {
    if (cookieBanner) {
      cookieBanner.classList.add('hidden');
    }
  }

  if (cookieAccept) cookieAccept.addEventListener('click', dismissCookies);
  if (cookieReject) cookieReject.addEventListener('click', dismissCookies);

  // =============================================
  // 5. Navbar Scroll Effect
  // =============================================
  var navbar = document.getElementById('landing-navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // =============================================
  // 6. FAQ Accordion
  // =============================================
  document.querySelectorAll('[data-faq-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-faq-toggle');
      var answer = document.getElementById('faq-answer-' + targetId);
      var chevron = btn.querySelector('.faq-chevron');
      var isOpen = answer && answer.classList.contains('open');

      // Fechar todos os FAQs
      document.querySelectorAll('.faq-answer').forEach(function (el) {
        el.classList.remove('open');
      });
      document.querySelectorAll('.faq-chevron').forEach(function (el) {
        el.classList.remove('open');
      });

      // Abrir o clicado (se estava fechado)
      if (!isOpen && answer) {
        answer.classList.add('open');
        if (chevron) chevron.classList.add('open');
      }
    });
  });

  // =============================================
  // 7. Smooth Scroll for Anchor Links
  // =============================================
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

})();
