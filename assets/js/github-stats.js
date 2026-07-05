(function () {
  const EXCLUDED_LANGS = new Set(['HTML', 'CSS', 'TypeScript']);
  const LANG_ALIASES = {
    HCL: 'CloudFormation Stack',
    YAML: 'CloudFormation Stack',
    CloudFormation: 'CloudFormation Stack',
  };
  const FEATURED_LANGS = ['Java', 'Scala', 'Python', 'C++', 'Shell', 'CloudFormation Stack'];

  const LANG_COLORS = {
    Java: '#b07219',
    Scala: '#c22d40',
    Python: '#3572A5',
    'C++': '#f34b7d',
    Shell: '#89e051',
    'CloudFormation Stack': '#ff9900',
    default: '#6c9eff',
  };

  function formatNumber(n) {
    if (n == null || Number.isNaN(n)) return '—';
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

    return featured.map((lang) => ({
      name: lang.name,
      bytes: lang.bytes,
      pct: featuredTotal ? Math.round((lang.bytes / featuredTotal) * 100) : 0,
      color: lang.color,
    }));
  }

  function buildLangBreakdownFromCached(cached) {
    const byName = Object.fromEntries(
      (cached?.lang_breakdown || []).map((lang) => [lang.name, lang])
    );

    return FEATURED_LANGS.map((name) => ({
      name,
      pct: byName[name]?.pct || 0,
      color: byName[name]?.color || langColor(name),
    }));
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

  function chartHasData(breakdown) {
    return breakdown.some((lang) => lang.pct > 0);
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

  async function fetchLiveLanguageStats(username) {
    const repos = [];
    for (let page = 1; page <= 2; page += 1) {
      const batch = await fetchJson(
        `https://api.github.com/users/${username}/repos?per_page=50&page=${page}&type=owner&sort=pushed`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch.filter((r) => !r.fork));
      if (batch.length < 50) break;
    }

    const langTotals = {};
    const sample = repos.slice(0, 30);
    for (const repo of sample) {
      try {
        const langs = await fetchJson(repo.languages_url);
        Object.entries(langs).forEach(([lang, bytes]) => {
          langTotals[lang] = (langTotals[lang] || 0) + bytes;
        });
      } catch {
        /* skip repo */
      }
    }

    return buildLangBreakdown(langTotals);
  }

  async function refreshStats(username, cached) {
    let repos = cached?.repos;
    let commits = cached?.commits;
    let stars = cached?.stars;
    let langBreakdown = buildLangBreakdownFromCached(cached);

    try {
      const user = await fetchJson(`https://api.github.com/users/${username}`);
      repos = user.public_repos ?? repos;
    } catch {
      /* keep cached repos */
    }

    if (!commits) {
      try {
        commits = await fetchLifetimeCommits(username);
      } catch {
        commits = cached?.commits ?? 0;
      }
    }

    try {
      const liveBreakdown = await fetchLiveLanguageStats(username);
      if (chartHasData(liveBreakdown)) {
        langBreakdown = liveBreakdown;
      }
    } catch {
      /* keep cached breakdown */
    }

    return {
      repos,
      commits,
      languages: FEATURED_LANGS.length,
      stars,
      langBreakdown,
    };
  }

  function renderStats(container, stats) {
    const map = {
      repos: formatNumber(stats.repos),
      commits: formatNumber(stats.commits),
      languages: String(stats.languages ?? FEATURED_LANGS.length),
      stars: formatNumber(stats.stars),
    };
    Object.entries(map).forEach(([key, value]) => {
      const el = container.querySelector(`[data-stat="${key}"]`);
      if (el && value !== '—') {
        el.textContent = value;
        el.classList.add('profile-stat__value--loaded');
      }
    });
  }

  function renderLangChart(container, breakdown) {
    if (!breakdown.length) return;

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
    const cachedBreakdown = buildLangBreakdownFromCached(cached);
    const serverRendered = chartEl.querySelector('.lang-row');

    if (cached?.commits || cached?.repos) {
      renderStats(statsEl, {
        repos: cached.repos,
        commits: cached.commits,
        languages: cached.languages ?? FEATURED_LANGS.length,
        stars: cached.stars,
      });
    }

    if (!serverRendered) {
      renderLangChart(chartEl, cachedBreakdown);
    }

    if (!chartHasData(cachedBreakdown) && !serverRendered) {
      chartEl.innerHTML =
        '<p class="lang-chart__empty">Language breakdown is generated during site deploy from your public GitHub repositories.</p>';
    }

    refreshStats(username, cached)
      .then((stats) => {
        renderStats(statsEl, stats);
        if (chartHasData(stats.langBreakdown)) {
          renderLangChart(chartEl, stats.langBreakdown);
        }
      })
      .catch(() => {
        /* keep server-rendered or cached chart */
      })
      .finally(() => {
        statsEl.classList.remove('profile-stats--loading');
      });
  });
})();
