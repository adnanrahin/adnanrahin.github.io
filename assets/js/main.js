document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
      }
    } else {
      root.removeAttribute('data-theme');
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
      }
    }
  }

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  applyTheme(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (e) {
        /* ignore */
      }
    });
  }

  const docsRail = document.getElementById('docs-rail');
  const docsToggle = document.querySelector('[data-docs-toggle]');
  const docsClose = document.querySelectorAll('[data-docs-close]');

  function setDocsRailOpen(open) {
    if (!docsRail) return;
    docsRail.classList.toggle('is-open', open);
    document.querySelectorAll('.docs-backdrop').forEach((el) => {
      el.classList.toggle('is-open', open);
    });
    if (docsToggle) docsToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (docsToggle && docsRail) {
    docsToggle.addEventListener('click', () => {
      setDocsRailOpen(!docsRail.classList.contains('is-open'));
    });
  }

  docsClose.forEach((el) => {
    el.addEventListener('click', () => setDocsRailOpen(false));
  });
});
