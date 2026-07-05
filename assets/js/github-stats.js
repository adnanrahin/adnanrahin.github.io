(function () {
  const EXCLUDED_LANGS = new Set(['HTML', 'CSS', 'TypeScript']);
  const LANG_ALIASES = {
    HCL: 'CloudFormation Stack',
    YAML: 'CloudFormation Stack',
    CloudFormation: 'CloudFormation Stack',
  };
  const FEATURED_LANGS = ['Java', 'Scala', 'Python', 'C++', 'Shell', 'CloudFormation Stack'];

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
    'CloudFormation Stack': '#ff9900',
    CloudFormation: '#ff9900',
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

  function normalizeLangTotals(langTotals) {
    const normalized = {};
    Object.entries(langTotals).forEach(([name, bytes]) => {
      if (EXCLUDED_LANGS.has(name)) return;
      const label = LANG_ALIASES[name] || name;
      normalized[label] = (normalized[label] || 0) + bytes;
    });
    return normalized;
  }

  function buildLangBreakdown(langTotals) {
    const normalized = normalizeLangTotals(langTotals);
    const featured = FEATURED_LANGS.map((name) => ({
      name,
      bytes: normalized[name] || 0,
      color: langColor(name),
    }));
    const featuredTotal = featured.reduce((sum, lang) => sum + lang.bytes, 0);

    return {
      languages: FEATURED_LANGS.length,
      langBreakdown: featured.map((lang) => ({
        name: lang.name,
        bytes: lang.bytes,
        pct: featuredTotal ? Math.round((lang.bytes / featuredTotal) * 100) : 0,
        color: lang.color,
      })),
    };
  }

  function buildLangBreakdownFromCached(cached) {
    if (!cached?.lang_breakdown?.length) return buildLangBreakdown({});

    const byName = Object.fromEntries(
      cached.lang_breakdown.map((lang) => [lang.name, lang.pct || 0])
    );

    return {
      languages: FEATURED_LANGS.length,
      langBreakdown: FEATURED_LANGS.map((name) => ({
        name,
        pct: byName[name] || 0,
        color: langColor(name),
      })),
    };
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

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return res.json();
  }

  async function fetchLifetimeCommits(username) {
    const query = encodeURIComponent(`author:${username} committer-date:>2008-01-01`);
    const result = await fetchJson(
      `https://api.github.com/search/commits?q=${query}&per_page=1`
    );
    return result.total_count || 0;
  }

  async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;
    while (page <= 10) {
      const batch = await fetchJson(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=pushed`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch.filter((r) => !r.fork));
      if (batch.length < 100) break;
      page += 1;
    }
    return repos;
  }

  async function fetchLiveLanguageStats(username, user) {
    const repos = await fetchAllRepos(username);
    const langTotals = {};
    let totalStars = 0;

    const chunkSize = 6;
    for (let i = 0; i < repos.length; i += chunkSize) {
      const chunk = repos.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (repo) => {
          totalStars += repo.stargazers_count || 0;
          try {
            const langs = await fetchJson(repo.languages_url);
            Object.entries(langs).forEach(([lang, bytes]) => {
              langTotals[lang] = (langTotals[lang] || 0) + bytes;
            });
          } catch {
            /* skip */
          }
        })
      );
    }

    const { languages, langBreakdown } = buildLangBreakdown(langTotals);

    return {
      repos: user.public_repos ?? repos.length,
      languages,
      stars: totalStars,
      langBreakdown,
    };
  }

  async function fetchGitHubStats(username, cached) {
    const user = await fetchJson(`https://api.github.com/users/${username}`);

    let commits = cached?.commits;
    if (!commits) {
      try {
        commits = await fetchLifetimeCommits(username);
      } catch {
        commits = 0;
      }
    }

    let langBreakdown = buildLangBreakdownFromCached(cached).langBreakdown;
    let repos = cached?.repos ?? user.public_repos;
    let languages = FEATURED_LANGS.length;
    let stars = cached?.stars;

    try {
      const live = await fetchLiveLanguageStats(username, user);
      repos = live.repos;
      stars = live.stars;
      langBreakdown = live.langBreakdown;
    } catch {
      /* use cached fallback */
    }

    return {
      repos,
      commits,
      languages,
      stars,
      langBreakdown,
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

  document.addEventListener('DOMContentLoaded', () => {
    const statsEl = document.getElementById('github-stats');
    const chartEl = document.getElementById('lang-chart');
    if (!statsEl || !chartEl) return;

    const username = statsEl.dataset.username;
    if (!username) return;

    const cached = readCachedStats();
    const hasCachedStats = cached && cached.commits;

    if (!hasCachedStats) {
      statsEl.classList.add('profile-stats--loading');
    }

    fetchGitHubStats(username, cached)
      .then((stats) => {
        renderStats(statsEl, stats);
        renderLangChart(chartEl, stats.langBreakdown);
      })
      .catch(() => {
        if (!hasCachedStats) {
          statsEl.querySelectorAll('[data-stat]').forEach((el) => {
            el.textContent = '—';
          });
        }
        chartEl.innerHTML = '<p class="lang-chart__empty">Could not load GitHub stats right now.</p>';
      })
      .finally(() => {
        statsEl.classList.remove('profile-stats--loading');
      });
  });
})();
