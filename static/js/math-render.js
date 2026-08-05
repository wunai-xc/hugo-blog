/**
 * KaTeX 数学公式渲染器
 * 直接扫描 DOM 中的 $...$ 和 $$...$$ 模式，用 KaTeX 渲染。
 * 不依赖 Hugo Passthrough 或 KaTeX auto-render 的 delimiter 检测。
 */
(function () {
  var MATH_DELIMITERS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false }
  ];

  var KATEX_OPTS = {
    throwOnError: false,
    strict: false,
    macros: {
      '\\RR': '\\mathbb{R}',
      '\\CC': '\\mathbb{C}',
      '\\ZZ': '\\mathbb{Z}'
    }
  };

  /**
   * 从文本中提取所有数学公式片段（支持嵌套）
   * 返回 [{tex, display, start, end}, ...]
   */
  function extractMathSegments(text) {
    var segments = [];
    var i = 0;

    while (i < text.length) {
      var ch = text[i];

      // 检查 $$...$$
      if (ch === '$' && text[i + 1] === '$') {
        var end = text.indexOf('$$', i + 2);
        if (end !== -1) {
          var tex = text.substring(i + 2, end);
          segments.push({ tex: tex, display: true, start: i, end: end + 2 });
          i = end + 2;
          continue;
        }
      }

      // 检查 $...$
      if (ch === '$' && text[i + 1] !== '$' && text[i + 1] !== ' ' && text[i + 1] !== '\n') {
        // 找到闭合的 $
        var closePos = findClosingDollar(text, i + 1);
        if (closePos !== -1) {
          var tex2 = text.substring(i + 1, closePos);
          if (tex2.length > 0) {
            segments.push({ tex: tex2, display: false, start: i, end: closePos + 1 });
            i = closePos + 1;
            continue;
          }
        }
      }

      // 检查 \[...\]
      if (ch === '\\' && text[i + 1] === '[') {
        var end2 = text.indexOf('\\]', i + 2);
        if (end2 !== -1) {
          segments.push({ tex: text.substring(i + 2, end2), display: true, start: i, end: end2 + 2 });
          i = end2 + 2;
          continue;
        }
      }

      // 检查 \(...\)
      if (ch === '\\' && text[i + 1] === '(') {
        var end3 = text.indexOf('\\)', i + 2);
        if (end3 !== -1) {
          segments.push({ tex: text.substring(i + 2, end3), display: false, start: i, end: end3 + 2 });
          i = end3 + 2;
          continue;
        }
      }

      i++;
    }

    return segments;
  }

  /**
   * 找闭合的 $，跳过被转义的 \$
   */
  function findClosingDollar(text, from) {
    var i = from;
    while (i < text.length) {
      if (text[i] === '\\' && text[i + 1] === '$') {
        i += 2;
        continue;
      }
      if (text[i] === '$' && text[i - 1] !== ' ') {
        return i;
      }
      i++;
    }
    return -1;
  }

  /**
   * 渲染一个文本节点中的所有数学公式
   * 如果渲染成功，返回替换后的 HTML；否则返回 null
   */
  function renderTextNode(node) {
    var text = node.nodeValue;
    if (!text || text.indexOf('$') === -1) return null;

    var segments = extractMathSegments(text);
    if (segments.length === 0) return null;

    // 构建新的 HTML
    var html = '';
    var lastEnd = 0;
    var hasError = false;

    for (var j = 0; j < segments.length; j++) {
      var seg = segments[j];

      // 添加前面的普通文本
      html += escapeHtml(text.substring(lastEnd, seg.start));

      // 尝试渲染
      try {
        var rendered = katex.renderToString(seg.tex, {
          throwOnError: false,
          strict: false,
          displayMode: seg.display,
          macros: KATEX_OPTS.macros
        });
        html += rendered;
      } catch (e) {
        // 渲染失败，保留原始文本
        html += escapeHtml(text.substring(seg.start, seg.end));
        hasError = true;
      }

      lastEnd = seg.end;
    }

    // 添加剩余的普通文本
    html += escapeHtml(text.substring(lastEnd));

    return hasError ? null : html;
  }

  /**
   * HTML 转义
   */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * 递归处理元素内的所有文本节点
   */
  function processElement(el) {
    // 跳过已处理的元素
    if (el.classList && el.classList.contains('katex')) return;
    if (el.classList && el.classList.contains('no-render')) return;
    if (el.classList && el.classList.contains('math')) {
      // Hugo 生成的 math 元素，直接渲染其 textContent
      var tex = (el.textContent || '').trim();
      if (tex) {
        try {
          var isDisplay = el.tagName === 'DIV' || el.classList.contains('display');
          katex.render(tex, el, {
            throwOnError: false,
            strict: false,
            displayMode: isDisplay,
            macros: KATEX_OPTS.macros
          });
        } catch (e) {
          el.style.color = '#ef4444';
        }
      }
      return;
    }

    // 处理子节点
    var childNodes = el.childNodes;
    var nodesToReplace = [];

    for (var i = 0; i < childNodes.length; i++) {
      var child = childNodes[i];

      if (child.nodeType === 3) {
        // 文本节点
        var rendered = renderTextNode(child);
        if (rendered) {
          nodesToReplace.push({ node: child, html: rendered });
        }
      } else if (child.nodeType === 1) {
        // 元素节点
        processElement(child);
      }
    }

    // 替换已渲染的文本节点
    for (var j = 0; j < nodesToReplace.length; j++) {
      var item = nodesToReplace[j];
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.html;
      while (tempDiv.firstChild) {
        item.node.parentNode.insertBefore(tempDiv.firstChild, item.node);
      }
      item.node.parentNode.removeChild(item.node);
    }
  }

  /**
   * 主函数
   */
  function init() {
    if (typeof katex === 'undefined') {
      console.warn('[math-render] KaTeX not loaded');
      return;
    }

    // 找到文章内容区域
    var contentEls = document.querySelectorAll('.post-content, .article-content, article');
    for (var i = 0; i < contentEls.length; i++) {
      processElement(contentEls[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
