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

  const docsIndex = document.querySelector('[data-docs-index]');
  if (docsIndex) {
    const perPage = parseInt(docsIndex.dataset.perPage, 10) || 6;
    const cards = Array.from(docsIndex.querySelectorAll('[data-index-card]'));
    const pagination = docsIndex.querySelector('[data-index-pagination]');
    const prevBtn = docsIndex.querySelector('[data-index-prev]');
    const nextBtn = docsIndex.querySelector('[data-index-next]');
    const info = docsIndex.querySelector('[data-index-info]');
    const totalPages = Math.max(1, Math.ceil(cards.length / perPage));
    let currentPage = 1;

    function showPage(page) {
      currentPage = Math.min(Math.max(1, page), totalPages);
      cards.forEach((card) => {
        const cardPage = parseInt(card.dataset.page, 10);
        card.hidden = cardPage !== currentPage;
      });
      if (info) info.textContent = `Page ${currentPage} of ${totalPages}`;
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    if (pagination && totalPages > 1) {
      pagination.hidden = false;
      if (prevBtn) {
        prevBtn.addEventListener('click', () => showPage(currentPage - 1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => showPage(currentPage + 1));
      }
    }

    showPage(1);
  }
});
