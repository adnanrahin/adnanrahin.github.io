(function () {
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
  }

  function prepareMermaidNodes() {
    document.querySelectorAll('pre code.language-mermaid').forEach((block) => {
      const pre = block.parentElement;
      if (!pre) return;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = block.textContent;
      pre.replaceWith(div);
    });
  }

  function boot() {
    if (typeof mermaid === 'undefined') return;
    prepareMermaidNodes();
    mermaid.initialize({
      startOnLoad: true,
      theme: getTheme(),
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
