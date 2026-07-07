(function () {
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
  }

  function prepareMermaidNodes() {
    document.querySelectorAll('pre code.language-mermaid').forEach((block) => {
      const pre = block.parentElement;
      if (!pre) return;
      const wrap = document.createElement('div');
      wrap.className = 'mermaid-wrap';
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = block.textContent;
      wrap.appendChild(div);
      pre.replaceWith(wrap);
    });

    document.querySelectorAll('.mermaid').forEach((node) => {
      if (node.closest('.mermaid-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'mermaid-wrap';
      node.parentNode.insertBefore(wrap, node);
      wrap.appendChild(node);
    });
  }

  function wrapTables() {
    document.querySelectorAll('.docs-content table, .post-content table').forEach((table) => {
      if (table.closest('.sd-metrics-box, .docs-table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'docs-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function boot() {
    prepareMermaidNodes();
    wrapTables();

    if (typeof mermaid === 'undefined') return;

    mermaid.initialize({
      startOnLoad: true,
      theme: getTheme(),
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        padding: 20,
        nodeSpacing: 48,
        rankSpacing: 56,
        diagramPadding: 12,
        wrappingWidth: 220
      },
      themeVariables: {
        fontSize: '14px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
