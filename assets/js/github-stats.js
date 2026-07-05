(function () {
  const FEATURED_LANGS = ['Java', 'Scala', 'Python', 'C++', 'Shell', 'CloudFormation Stack'];

  function formatNumber(n) {
    if (n == null || Number.isNaN(Number(n))) return null;
    const num = Number(n);
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
  }

  function readCachedStats() {
    const el = document.getElementById('github-stats-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch {
      return null;
    }
  }

  function renderStats(container, stats) {
    if (!stats) return;

    const map = {
      repos: formatNumber(stats.repos),
      commits: formatNumber(stats.commits),
      languages: String(stats.languages ?? FEATURED_LANGS.length),
      stars: formatNumber(stats.stars),
    };

    Object.entries(map).forEach(([key, value]) => {
      if (value == null) return;
      const el = container.querySelector(`[data-stat="${key}"]`);
      if (el) {
        el.textContent = value;
        el.classList.add('profile-stat__value--loaded');
      }
    });
  }

  function animateLangBars(container) {
    container.querySelectorAll('.lang-row__bar').forEach((bar) => {
      const target = bar.dataset.width || bar.style.width;
      if (!target) return;
      bar.style.width = '0%';
      bar.dataset.width = target;
      requestAnimationFrame(() => {
        bar.style.width = target;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const statsEl = document.getElementById('github-stats');
    const chartEl = document.getElementById('lang-chart');
    const cached = readCachedStats();

    if (statsEl && cached) {
      renderStats(statsEl, cached);
    }

    if (chartEl) {
      chartEl.querySelectorAll('.lang-row__bar').forEach((bar) => {
        if (!bar.dataset.width) {
          bar.dataset.width = bar.style.width;
        }
      });
      animateLangBars(chartEl);
    }
  });
})();
