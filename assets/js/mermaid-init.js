document.addEventListener('DOMContentLoaded', () => {
  if (typeof mermaid === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true }
  });

  const mermaidPattern = /^(flowchart|graph\s|sequenceDiagram|classDiagram|stateDiagram|erDiagram|C4Context|gitGraph|pie\s)/;

  document.querySelectorAll('.post-content pre code, .sd-article__body pre code').forEach((code) => {
    const text = code.textContent.trim();
    if (!mermaidPattern.test(text)) return;

    const pre = code.closest('pre');
    if (!pre) return;

    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = text;
    pre.replaceWith(div);
  });

  const nodes = document.querySelectorAll('.mermaid');
  if (nodes.length > 0) {
    mermaid.run({ nodes: Array.from(nodes) });
  }
});
