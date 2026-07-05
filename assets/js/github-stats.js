(function () {
  const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Scala: '#c22d40',
    'C++': '#f34b7d',
    C: '#555555',
    Go: '#00ADD8',
    Rust: '#dea584',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Dockerfile: '#384d54',
    Jupyter: '#DA5B0B',
    Kotlin: '#A97BFF',
    Ruby: '#701516',
    Swift: '#F05138',
    PHP: '#4F5D95',
    Vue: '#41b883',
    default: '#6c9eff',
  };

  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function langColor(name) {
    return LANG_COLORS[name] || LANG_COLORS.default;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return res.json();
  }

  async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;
    while (page <= 5) {
      const batch = await fetchJson(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=updated`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch.filter((r) => !r.fork));
      if (batch.length < 100) break;
      page += 1;
    }
    return repos;
  }

  async function fetchGitHubStats(username) {
    const [user, repos] = await Promise.all([
      fetchJson(`https://api.github.com/users/${username}`),
      fetchAllRepos(username),
    ]);

    const langTotals = {};
    let totalCommits = 0;
    let totalStars = 0;

    const chunkSize = 8;
    for (let i = 0; i < repos.length; i += chunkSize) {
      const chunk = repos.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (repo) => {
          totalStars += repo.stargazers_count || 0;
          try {
            const [langs, contributors] = await Promise.all([
              fetchJson(repo.languages_url),
              fetchJson(`${repo.url}/contributors?per_page=100&anon=true`),
            ]);
            Object.entries(langs).forEach(([lang, bytes]) => {
              langTotals[lang] = (langTotals[lang] || 0) + bytes;
            });
            const mine = contributors.find(
              (c) => c.login === username || c.login === user.login
            );
            if (mine) totalCommits += mine.contributions || 0;
          } catch {
            /* skip inaccessible repos */
          }
        })
      );
    }

    const langEntries = Object.entries(langTotals).sort((a, b) => b[1] - a[1]);
    const totalBytes = langEntries.reduce((sum, [, b]) => sum + b, 0);

    return {
      repos: user.public_repos ?? repos.length,
      commits: totalCommits,
      languages: langEntries.length,
      stars: totalStars,
      langBreakdown: langEntries.slice(0, 8).map(([name, bytes]) => ({
        name,
        bytes,
        pct: totalBytes ? Math.round((bytes / totalBytes) * 100) : 0,
        color: langColor(name),
      })),
    };
  }

  function renderStats(container, stats) {
    const map = {
      repos: formatNumber(stats.repos),
      commits: formatNumber(stats.commits),
      languages: String(stats.languages),
      stars: formatNumber(stats.stars),
    };
    Object.entries(map).forEach(([key, value]) => {
      const el = container.querySelector(`[data-stat="${key}"]`);
      if (el) {
        el.textContent = value;
        el.classList.add('profile-stat__value--loaded');
      }
    });
  }

  function renderLangChart(container, breakdown) {
    if (!breakdown.length) {
      container.innerHTML = '<p class="lang-chart__empty">No public language data available.</p>';
      return;
    }

    container.innerHTML = breakdown
      .map(
        (lang) => `
        <div class="lang-row">
          <div class="lang-row__header">
            <span class="lang-row__name">
              <span class="lang-row__dot" style="background:${lang.color}"></span>
              ${lang.name}
            </span>
            <span class="lang-row__pct">${lang.pct}%</span>
          </div>
          <div class="lang-row__track">
            <div class="lang-row__bar" style="width:0%;background:${lang.color}" data-width="${lang.pct}%"></div>
          </div>
        </div>`
      )
      .join('');

    requestAnimationFrame(() => {
      container.querySelectorAll('.lang-row__bar').forEach((bar) => {
        bar.style.width = bar.dataset.width;
      });
    });
  }

  function showStatsError(container) {
    container.querySelectorAll('[data-stat]').forEach((el) => {
      el.textContent = '—';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const statsEl = document.getElementById('github-stats');
    const chartEl = document.getElementById('lang-chart');
    if (!statsEl || !chartEl) return;

    const username = statsEl.dataset.username;
    if (!username) return;

    statsEl.classList.add('profile-stats--loading');

    fetchGitHubStats(username)
      .then((stats) => {
        renderStats(statsEl, stats);
        renderLangChart(chartEl, stats.langBreakdown);
      })
      .catch(() => {
        showStatsError(statsEl);
        chartEl.innerHTML = '<p class="lang-chart__empty">Could not load GitHub stats right now.</p>';
      })
      .finally(() => {
        statsEl.classList.remove('profile-stats--loading');
      });
  });
})();
