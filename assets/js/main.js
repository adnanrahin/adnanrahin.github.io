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

  const sdSidebar = document.getElementById('sd-sidebar');
  const sdToggle = document.querySelector('[data-sd-sidebar-toggle]');
  const sdCloseTargets = document.querySelectorAll('[data-sd-sidebar-close]');

  function setSdSidebarOpen(open) {
    if (!sdSidebar) return;
    sdSidebar.classList.toggle('is-open', open);
    document.querySelectorAll('.sd-backdrop').forEach((el) => {
      el.classList.toggle('is-open', open);
    });
    if (sdToggle) sdToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (sdToggle && sdSidebar) {
    sdToggle.addEventListener('click', () => {
      setSdSidebarOpen(!sdSidebar.classList.contains('is-open'));
    });
  }

  sdCloseTargets.forEach((el) => {
    el.addEventListener('click', () => setSdSidebarOpen(false));
  });
});
