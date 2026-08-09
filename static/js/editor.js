/**
 * blog-editor — 静态 Markdown 编辑器
 *
 * 功能：IndexedDB 本地多草稿管理 + 实时预览（marked + Mermaid/ECharts/Graphviz/abc.js + KaTeX）+ gist 云同步
 * 依赖：marked.js（CDN，在 editor.html 里已引入）
 */
(function () {
  'use strict';

  var LANG = window.__EDITOR_LANG__ || 'zh';
  var i18n = {
    zh: { saved:'已保存', saving:'保存中...', ready:'就绪', autoSaved:'自动保存', newDraft:'新草稿', confirmDel:'确认删除这篇草稿？', confirmClear:'确认清空全部草稿？此操作不可撤销！', noToken:'请先在设置中填写 GitHub Token', noDrafts:'没有草稿', draftCount:'篇', syncOk:'同步成功', syncFail:'同步失败', pushOk:'备份成功', pullOk:'恢复成功', gistCreateFail:'创建 Gist 失败', gistReadFail:'读取 Gist 失败', exported:'已导出', wordCount:'字' },
    en: { saved:'Saved', saving:'Saving...', ready:'Ready', autoSaved:'Auto-saved', newDraft:'New Draft', confirmDel:'Delete this draft?', confirmClear:'Clear ALL drafts? This cannot be undone!', noToken:'Please set GitHub Token in Settings first', noDrafts:'No drafts', draftCount:'drafts', syncOk:'Synced', syncFail:'Sync failed', pushOk:'Backup OK', pullOk:'Restore OK', gistCreateFail:'Failed to create Gist', gistReadFail:'Failed to read Gist', exported:'Exported', wordCount:'words' }
  };
  var t = function(k) { return (i18n[LANG] || i18n.zh)[k] || k; };

  // ===== 常量 =====
  var DB_NAME = 'blog-editor';
  var DB_VERSION = 1;
  var STORE = 'drafts';
  var SETTINGS_KEY = 'editor-settings';
  var AUTOSAVE_MS = 800;
  var PREVIEW_MS = 250;

  // ===== 状态 =====
  var db = null;
  var currentId = null;
  var saveTimer = null;
  var previewTimer = null;
  var allDrafts = [];

  // ===== DOM 缓存 =====
  var $ = function(id) { return document.getElementById(id); };
  var elTitle, elTextarea, elPreview, elStatus, elFileList, elSearch, elDraftCount, elPreviewMeta;

  // ===== IndexedDB =====
  function openDB() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          var s = d.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      req.onsuccess = function(e) { db = e.target.result; resolve(db); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }

  function dbAll() {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).getAll();
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
  }

  function dbPut(doc) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(doc);
      tx.oncomplete = function() { resolve(doc); };
      tx.onerror = function() { reject(tx.error); };
    });
  }

  function dbDel(id) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  }

  function dbClear() {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  }

  // ===== 设置（localStorage）=====
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
    catch(e) { return {}; }
  }
  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e) {}
  }

  // ===== 工具函数 =====
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function fmtTime(ts) {
    var d = new Date(ts);
    var now = new Date();
    var diff = now - d;
    if (diff < 60000) return LANG === 'en' ? 'just now' : '刚刚';
    if (diff < 3600000) return Math.floor(diff/60000) + (LANG === 'en' ? 'm' : '分钟前');
    if (diff < 86400000) return Math.floor(diff/3600000) + (LANG === 'en' ? 'h' : '小时前');
    var mm = String(d.getMonth()+1).padStart(2,'0');
    var dd = String(d.getDate()).padStart(2,'0');
    var hh = String(d.getHours()).padStart(2,'0');
    var mi = String(d.getMinutes()).padStart(2,'0');
    return mm + '/' + dd + ' ' + hh + ':' + mi;
  }
  function extractTitle(content) {
    if (!content) return '';
    var m = content.match(/^#\s+(.+)$/m);
    if (m) return m[1].trim();
    m = content.match(/^.{0,50}/);
    return m ? m[0].replace(/[#*`>\-\[\]]/g,'').trim() : '';
  }
  function setStatus(msg) { if (elStatus) elStatus.textContent = msg; }
  function debounce(fn, ms) {
    var timer = null;
    return function() {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  // ===== 文件列表渲染 =====
  function renderFileList(filter) {
    filter = filter || '';
    var frag = document.createDocumentFragment();
    var count = 0;

    allDrafts.sort(function(a,b) { return (b.updatedAt||0) - (a.updatedAt||0); });

    allDrafts.forEach(function(d) {
      var title = d.title || t('newDraft');
      if (filter && title.toLowerCase().indexOf(filter.toLowerCase()) === -1) return;
      count++;
      var li = document.createElement('li');
      li.className = 'ed-file-item' + (d.id === currentId ? ' active' : '');
      li.dataset.id = d.id;
      li.innerHTML =
        '<span class="ed-file-item-title">' + escapeHTML(title) + '</span>' +
        '<span class="ed-file-item-meta">' + fmtTime(d.updatedAt || d.createdAt || Date.now()) + '</span>' +
        '<button class="ed-file-del" title="Delete">✕</button>';
      li.addEventListener('click', function(e) {
        if (e.target.classList.contains('ed-file-del')) {
          e.stopPropagation();
          if (confirm(t('confirmDel'))) {
            dbDel(d.id).then(function() {
              allDrafts = allDrafts.filter(function(x) { return x.id !== d.id; });
              if (currentId === d.id) {
                if (allDrafts.length > 0) loadDocument(allDrafts[0].id);
                else newDocument();
              }
              renderFileList(elSearch ? elSearch.value : '');
              updateDraftCount();
            });
          }
          return;
        }
        loadDocument(d.id);
      });
      frag.appendChild(li);
    });

    if (elFileList) {
      elFileList.innerHTML = '';
      elFileList.appendChild(frag);
    }
    updateDraftCount();
  }

  function updateDraftCount() {
    if (elDraftCount) elDraftCount.textContent = allDrafts.length + ' ' + t('draftCount');
  }

  // ===== 文档操作 =====
  function newDocument() {
    currentId = null;
    if (elTitle) elTitle.value = '';
    if (elTextarea) elTextarea.value = '';
    if (elPreview) elPreview.innerHTML = '';
    renderFileList(elSearch ? elSearch.value : '');
    setStatus(t('ready'));
    updateWordCount();
  }

  function loadDocument(id) {
    var doc = allDrafts.filter(function(d) { return d.id === id; })[0];
    if (!doc) return;
    currentId = id;
    if (elTitle) elTitle.value = doc.title || '';
    if (elTextarea) elTextarea.value = doc.content || '';
    renderFileList(elSearch ? elSearch.value : '');
    setStatus(t('ready'));
    updatePreview();
    updateWordCount();
  }

  var autoSave = debounce(function() {
    var content = elTextarea ? elTextarea.value : '';
    var title = elTitle ? elTitle.value.trim() : '';
    if (!title) title = extractTitle(content) || t('newDraft');

    var doc = {
      id: currentId || uid(),
      title: title,
      content: content,
      updatedAt: Date.now(),
      createdAt: currentId ? (allDrafts.filter(function(d){return d.id===currentId;})[0] || {}).createdAt || Date.now() : Date.now()
    };

    setStatus(t('saving'));
    dbPut(doc).then(function() {
      currentId = doc.id;
      var existing = allDrafts.filter(function(d) { return d.id === doc.id; })[0];
      if (existing) {
        existing.title = doc.title;
        existing.content = doc.content;
        existing.updatedAt = doc.updatedAt;
      } else {
        allDrafts.unshift(doc);
      }
      setStatus(t('saved'));
      renderFileList(elSearch ? elSearch.value : '');
    }).catch(function(err) {
      setStatus('Error: ' + (err.message || err));
    });
  }, AUTOSAVE_MS);

  function duplicateCurrent() {
    if (!currentId) return;
    var doc = allDrafts.filter(function(d) { return d.id === currentId; })[0];
    if (!doc) return;
    var copy = {
      id: uid(),
      title: doc.title + ' (copy)',
      content: doc.content,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    dbPut(copy).then(function() {
      allDrafts.unshift(copy);
      loadDocument(copy.id);
    });
  }

  function exportMarkdown() {
    var content = elTextarea ? elTextarea.value : '';
    var title = elTitle ? elTitle.value.trim() : extractTitle(content) || 'draft';
    var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.md';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 100);
    setStatus(t('exported'));
  }

  function updateWordCount() {
    if (!elPreviewMeta) return;
    var content = elTextarea ? elTextarea.value : '';
    var words = content.replace(/\s/g, '').length;
    var lines = content.split('\n').length;
    elPreviewMeta.textContent = words + ' ' + t('wordCount') + ' · ' + lines + ' lines';
  }

  // ===== Markdown 预览 =====
  var markedReady = false;
  function ensureMarked() {
    if (markedReady || typeof marked !== 'undefined') {
      markedReady = true;
      return true;
    }
    return false;
  }

  function initMarked() {
    if (!ensureMarked()) return false;
    // 注册数学公式扩展（$$...$$ 块级 / $...$ 行级）
    marked.use({
      breaks: false,
      gfm: true,
      extensions: [
        {
          name: 'mathBlock',
          level: 'block',
          start: function(src) { return src.indexOf('$$'); },
          tokenizer: function(src) {
            var m = /^\$\$([\s\S]+?)\$\$(?:\n|$)/.exec(src);
            if (m) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
          },
          renderer: function(token) {
            return '<div class="math-display">' + escapeHTML(token.text) + '</div>';
          }
        },
        {
          name: 'mathInline',
          level: 'inline',
          start: function(src) { return src.indexOf('$'); },
          tokenizer: function(src) {
            var m = /^\$([^\$\n]+?)\$/.exec(src);
            if (m) return { type: 'mathInline', raw: m[0], text: m[1].trim() };
          },
          renderer: function(token) {
            return '<span class="math-inline">' + escapeHTML(token.text) + '</span>';
          }
        }
      ]
    });
    return true;
  }

  var updatePreview = debounce(function() {
    var md = elTextarea ? elTextarea.value : '';
    if (!md.trim()) {
      if (elPreview) elPreview.innerHTML = '';
      updateWordCount();
      return;
    }
    if (!initMarked()) {
      // marked 还没加载完，延迟重试
      setTimeout(updatePreview, 200);
      return;
    }
    var html;
    try { html = marked.parse(md); }
    catch(e) { html = '<p style="color:#ef4444">Parse error: ' + escapeHTML(e.message) + '</p>'; }
    if (elPreview) {
      elPreview.innerHTML = html;
      renderPreviewContent(elPreview);
    }
    updateWordCount();
  }, PREVIEW_MS);

  // ===== 预览区内容渲染（图表 / 公式 / 中文优化）=====
  var scriptCache = {};
  function loadScript(src) {
    if (scriptCache[src]) return scriptCache[src];
    return scriptCache[src] = new Promise(function(res, rej) {
      var s = document.createElement('script');
      s.defer = true;
      s.src = src;
      s.onload = function() { res(true); };
      s.onerror = function() { scriptCache[src] = null; rej(new Error('load: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function renderPreviewContent(container) {
    // 1. 中文优化
    try { cnOptimize(container); } catch(e) {}

    // 2. XSS 过滤
    try { xssFilterContainer(container); } catch(e) {}

    // 3. 数学公式（KaTeX）
    renderMath(container);

    // 4. 图表（Mermaid / Graphviz / ECharts / abc.js）
    renderMermaidBlocks(container);
    renderGraphvizBlocks(container);
    renderEChartsBlocks(container);
    renderAbcBlocks(container);
  }

  // --- 中文语境优化（与 extend_footer 逻辑一致，独立实现）---
  function cnOptimize(root) {
    var SKIP = ['CODE','PRE','SCRIPT','STYLE','KBD','VAR','SAMP','TEXTAREA','INPUT','SELECT','MATH','SVG','CANVAS'];
    var skipCls = ['katex','katex-display','mermaid-wrap','graphviz-wrap','echarts-wrap','abc-wrap','math-display','math-inline'];

    function apply(s) {
      if (!s) return s;
      // 术语修正
      s = s.replace(/Three\.sj(?![A-Za-z])/g, 'Three.js');
      s = s.replace(/JavasScript(?![A-Za-z])/g, 'JavaScript');
      s = s.replace(/Javascript(?![A-Za-z])/g, 'JavaScript');
      s = s.replace(/Typescript(?![A-Za-z])/g, 'TypeScript');
      s = s.replace(/Html(?![A-Za-z])/g, 'HTML');
      // 中文字符后英文标点 → 中文标点
      s = s.replace(/([\u4e00-\u9fff\uff00-\uffef])([.,!?;:])(?=\s|$|\n|[\u4e00-\u9fff\uff00-\uffef"']|[\(\)\[\]\{\}])/g,
        function(m, cn, p, off, str) {
          var prev = off > 0 ? str.charAt(off-1) : '';
          var next = str.charAt(off+2) || '';
          if (/[0-9]/.test(prev) && /[0-9]/.test(next)) return m;
          if (p === '.' && /[A-Za-z0-9]/.test(next)) return m;
          if (p === '.' && /[A-Za-z]/.test(prev)) return m;
          if (p === ':' && /[0-9]/.test(prev) && /[0-9]/.test(next)) return m;
          var map = { '.':'。', ',':'，', '!':'！', '?':'？', ';':'；', ':':'：' };
          return cn + (map[p] || p);
        });
      // 中西文加细空格
      var CN = '[\u4e00-\u9fff\uff00-\uffef]';
      var W = '[A-Za-z0-9\\+\\/=\\*#%&@\\$°€£§]';
      s = s.replace(new RegExp('('+CN+')('+W+')','g'), '$1\u2009$2');
      s = s.replace(new RegExp('('+W+')('+CN+')','g'), '$1\u2009$2');
      return s;
    }

    function walk(node) {
      if (node.nodeType === 3) {
        var txt = node.nodeValue;
        if (!txt) return;
        var after = apply(txt);
        if (after !== txt) node.nodeValue = after;
        return;
      }
      if (node.nodeType !== 1) return;
      if (SKIP.indexOf(node.tagName) !== -1) return;
      if (node.classList) {
        for (var i = 0; i < skipCls.length; i++) {
          if (node.classList.contains(skipCls[i])) return;
        }
      }
      var children = Array.prototype.slice.call(node.childNodes);
      for (var i = 0; i < children.length; i++) walk(children[i]);
    }
    walk(root);
  }

  // --- XSS 过滤 ---
  function xssFilterContainer(root) {
    var forbid = ['javascript:', 'vbscript:'];
    root.querySelectorAll('a[href], img[src], iframe[src], script, form[action]').forEach(function(el) {
      ['href','src','action'].forEach(function(attr) {
        var v = el.getAttribute(attr);
        if (!v) return;
        var low = String(v).trim().toLowerCase().replace(/\s+/g,'');
        for (var i = 0; i < forbid.length; i++) {
          if (low.indexOf(forbid[i]) === 0) {
            if (el.tagName === 'SCRIPT' || el.tagName === 'IFRAME') { el.remove(); return; }
            el.removeAttribute(attr);
          }
        }
        if (attr === 'src' && low.indexOf('data:') === 0 && !/^data:image\//i.test(String(v).trim())) {
          el.removeAttribute(attr);
        }
      });
      // 删除 on* 事件属性
      var attrs = Array.prototype.slice.call(el.attributes || []);
      attrs.forEach(function(a) {
        if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    root.querySelectorAll('script').forEach(function(s) { s.remove(); });
  }

  // --- KaTeX 数学公式 ---
  function renderMath(container) {
    var blocks = container.querySelectorAll('.math-display');
    var inlines = container.querySelectorAll('.math-inline');
    if (!blocks.length && !inlines.length) return;

    function doRender() {
      blocks.forEach(function(el) {
        try { katex.render(el.textContent, el, { displayMode: true, throwOnError: false }); }
        catch(e) { el.innerHTML = '<span style="color:#ef4444">' + escapeHTML(el.textContent) + '</span>'; }
      });
      inlines.forEach(function(el) {
        try { katex.render(el.textContent, el, { displayMode: false, throwOnError: false }); }
        catch(e) { el.innerHTML = '<span style="color:#ef4444">' + escapeHTML(el.textContent) + '</span>'; }
      });
    }

    if (typeof katex !== 'undefined') { doRender(); return; }
    // 动态加载 KaTeX
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
    document.head.appendChild(css);
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js').catch(function(){})
    ]).then(doRender).catch(function(e) {
      console.warn('[editor] KaTeX load fail', e);
    });
  }

  // --- Mermaid ---
  function renderMermaidBlocks(container) {
    var nodes = container.querySelectorAll('pre code.language-mermaid');
    if (!nodes.length) return;
    loadScript('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js').then(function() {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default' });
      nodes.forEach(function(codeEl, i) {
        var src = (codeEl.textContent || '').trim();
        if (!src) return;
        var id = 'ed-mmd-' + i;
        var wrap = document.createElement('div');
        wrap.className = 'mermaid-wrap';
        mermaid.render(id, src).then(function(r) {
          wrap.innerHTML = r.svg || r;
        }).catch(function(err) {
          wrap.innerHTML = '<pre style="color:#ef4444;padding:8px;border:1px dashed #ef4444;border-radius:4px;font-size:12px">[Mermaid] ' + escapeHTML(err.message || err) + '</pre>';
        });
        codeEl.parentElement.replaceWith(wrap);
      });
    }).catch(function(e) { console.warn('[editor] mermaid load fail', e); });
  }

  // --- Graphviz ---
  function renderGraphvizBlocks(container) {
    var nodes = container.querySelectorAll('pre code.language-graphviz, pre code.language-dot');
    if (!nodes.length) return;
    loadScript('https://cdn.jsdelivr.net/npm/@viz-js/viz@3.11.0/lib/viz-standalone.js').then(function() {
      nodes.forEach(function(codeEl) {
        var src = (codeEl.textContent || '').trim();
        if (!src) return;
        var wrap = document.createElement('div');
        wrap.className = 'graphviz-wrap';
        try {
          var inst = new Viz();
          inst.renderSVGElement(src).then(function(svg) { wrap.appendChild(svg); })
            .catch(function(err) { wrap.innerHTML = '<pre style="color:#ef4444;font-size:12px">[Graphviz] ' + escapeHTML(err.message||err) + '</pre>'; });
        } catch(e) {
          wrap.innerHTML = '<pre style="color:#ef4444;font-size:12px">[viz.js] ' + escapeHTML(e.message) + '</pre>';
        }
        codeEl.parentElement.replaceWith(wrap);
      });
    }).catch(function(e) { console.warn('[editor] viz.js load fail', e); });
  }

  // --- ECharts ---
  function renderEChartsBlocks(container) {
    var nodes = container.querySelectorAll('pre code.language-echarts');
    if (!nodes.length) return;
    Promise.all([
      loadScript('https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js'),
      loadScript('https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.2/dist/echarts-wordcloud.min.js').catch(function(){})
    ]).then(function() {
      nodes.forEach(function(codeEl, i) {
        var src = (codeEl.textContent || '').trim();
        if (!src) return;
        var wrap = document.createElement('div');
        wrap.className = 'echarts-wrap';
        var box = document.createElement('div');
        box.style.width = '100%';
        box.style.height = '400px';
        box.style.border = '1px solid var(--border,#e5e7eb)';
        box.style.borderRadius = '8px';
        wrap.appendChild(box);
        try {
          var option;
          if (/^\s*\{/.test(src)) {
            option = eval('(' + src.replace(/^[\t ]*\/\/[^\n]*/gm,'').replace(/\/\*[\s\S]*?\*\//g,'') + ')');
          } else {
            var __opt; eval(src.replace(/^[\t ]*\/\/[^\n]*/gm,'').replace(/\/\*[\s\S]*?\*\//g,''));
            option = __opt;
          }
          if (!option) throw new Error('No option found');
          var inst = echarts.init(box, document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : null);
          inst.setOption(option);
          new ResizeObserver(function() { inst.resize(); }).observe(box);
        } catch(e) {
          wrap.innerHTML = '<pre style="color:#ef4444;font-size:12px">[ECharts] ' + escapeHTML(e.message) + '\n\n' + escapeHTML(src) + '</pre>';
        }
        codeEl.parentElement.replaceWith(wrap);
      });
    }).catch(function(e) { console.warn('[editor] echarts load fail', e); });
  }

  // --- abc.js 五线谱 ---
  function renderAbcBlocks(container) {
    var nodes = container.querySelectorAll('pre code.language-abc, pre code.language-abcjs');
    if (!nodes.length) return;
    loadScript('https://cdn.jsdelivr.net/npm/abcjs@6.2.2/dist/abcjs-basic-min.js').then(function() {
      nodes.forEach(function(codeEl) {
        var src = (codeEl.textContent || '').trim();
        if (!src) return;
        var wrap = document.createElement('div');
        wrap.className = 'abc-wrap';
        try {
          ABCJS.renderAbc(wrap, src, { responsive: 'resize', paddingleft: 14, paddingright: 14 });
        } catch(e) {
          wrap.innerHTML = '<pre style="color:#ef4444;font-size:12px">[abc.js] ' + escapeHTML(e.message) + '</pre>';
        }
        codeEl.parentElement.replaceWith(wrap);
      });
    }).catch(function(e) { console.warn('[editor] abcjs load fail', e); });
  }

  // ===== 工具栏 =====
  function insertAtCursor(before, after, placeholder) {
    after = after || '';
    placeholder = placeholder || '';
    var ta = elTextarea;
    if (!ta) return;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var selected = ta.value.substring(start, end);
    var text = selected || placeholder;
    var insert = before + text + after;
    ta.value = ta.value.substring(0, start) + insert + ta.value.substring(end);
    ta.focus();
    if (!selected) {
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + placeholder.length;
    } else {
      ta.selectionStart = start;
      ta.selectionEnd = start + insert.length;
    }
    ta.dispatchEvent(new Event('input'));
  }

  function insertLine(prefix, placeholder) {
    var ta = elTextarea;
    if (!ta) return;
    var start = ta.selectionStart;
    var lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    var lineEnd = ta.value.indexOf('\n', start);
    if (lineEnd === -1) lineEnd = ta.value.length;
    var line = ta.value.substring(lineStart, lineEnd);
    var newLine = prefix + (line || placeholder);
    ta.value = ta.value.substring(0, lineStart) + newLine + ta.value.substring(lineEnd);
    ta.focus();
    ta.selectionStart = lineStart;
    ta.selectionEnd = lineStart + newLine.length;
    ta.dispatchEvent(new Event('input'));
  }

  function handleToolbar(action) {
    switch(action) {
      case 'bold': insertAtCursor('**','**','粗体'); break;
      case 'italic': insertAtCursor('*','*','斜体'); break;
      case 'strike': insertAtCursor('~~','~~','删除线'); break;
      case 'code': insertAtCursor('`','`','code'); break;
      case 'codeblock': insertAtCursor('\n```\n','\n```\n','code'); break;
      case 'link': insertAtCursor('[','](https://)','链接文字'); break;
      case 'image': insertAtCursor('![','](/images/)','alt'); break;
      case 'quote': insertLine('> ','引用'); break;
      case 'ul': insertLine('- ','列表项'); break;
      case 'ol': insertLine('1. ','列表项'); break;
      case 'task': insertLine('- [ ] ','待办事项'); break;
      case 'heading': insertLine('## ','标题'); break;
      case 'hr':
        insertAtCursor('\n---\n','','');
        break;
      case 'table':
        insertAtCursor('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n','','');
        break;
      case 'math':
        insertAtCursor('$','$','E=mc^2');
        break;
      case 'mermaid':
        insertAtCursor('\n```mermaid\n','\n```\n','flowchart LR\n    A --> B\n    B --> C');
        break;
    }
  }

  // ===== gist 云同步 =====
  function gistPush() {
    var settings = getSettings();
    if (!settings.gistToken) { alert(t('noToken')); return; }

    setStatus(t('saving') + ' → gist...');
    var data = {
      description: 'blog-editor drafts backup',
      public: false,
      files: {}
    };
    // 把所有草稿打包成一个 JSON 文件
    data.files['drafts.json'] = {
      content: JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        drafts: allDrafts
      }, null, 2)
    };

    var gistId = settings.gistId;
    var url = gistId
      ? 'https://api.github.com/gists/' + gistId
      : 'https://api.github.com/gists';
    var method = gistId ? 'PATCH' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Authorization': 'Bearer ' + settings.gistToken,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function(gist) {
      if (!settings.gistId && gist.id) {
        settings.gistId = gist.id;
        saveSettings(settings);
        var idInput = $('ed-gist-id');
        if (idInput) idInput.value = gist.id;
      }
      setStatus(t('pushOk') + ' (' + allDrafts.length + ' drafts)');
    }).catch(function(err) {
      setStatus(t('syncFail') + ': ' + (err.message || err));
      alert(t('gistCreateFail') + '\n' + (err.message || err));
    });
  }

  function gistPull() {
    var settings = getSettings();
    if (!settings.gistToken) { alert(t('noToken')); return; }
    if (!settings.gistId) { alert(LANG === 'en' ? 'No Gist ID. Push first to create one.' : '没有 Gist ID，请先备份创建。'); return; }

    setStatus('gist → ' + t('saving') + '...');
    fetch('https://api.github.com/gists/' + settings.gistId, {
      headers: {
        'Authorization': 'Bearer ' + settings.gistToken,
        'Accept': 'application/vnd.github+json'
      }
    }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function(gist) {
      var f = gist.files && gist.files['drafts.json'];
      if (!f || !f.content) throw new Error('drafts.json not found in gist');
      var data = JSON.parse(f.content);
      if (!data || !Array.isArray(data.drafts)) throw new Error('Invalid backup format');

      // 合并策略：以 gist 为准，本地有但 gist 没有的草稿保留
      var remoteDrafts = data.drafts;
      var remoteIds = remoteDrafts.map(function(d) { return d.id; });
      var localOnly = allDrafts.filter(function(d) { return remoteIds.indexOf(d.id) === -1; });
      var merged = remoteDrafts.concat(localOnly);

      // 写入 IndexedDB
      var promises = merged.map(function(d) { return dbPut(d); });
      return Promise.all(promises).then(function() {
        allDrafts = merged;
        renderFileList(elSearch ? elSearch.value : '');
        if (allDrafts.length > 0) loadDocument(allDrafts[0].id);
        else newDocument();
        setStatus(t('pullOk') + ' (' + remoteDrafts.length + ' drafts)');
      });
    }).catch(function(err) {
      setStatus(t('syncFail') + ': ' + (err.message || err));
      alert(t('gistReadFail') + '\n' + (err.message || err));
    });
  }

  // ===== 设置面板 =====
  function openSettings() {
    var s = getSettings();
    var tokenInput = $('ed-gist-token');
    var pushTokenInput = $('ed-push-token');
    var repoInput = $('ed-push-repo');
    var idInput = $('ed-gist-id');
    var themeSelect = $('ed-preview-theme');
    var liveCheck = $('ed-live-preview');
    if (tokenInput) tokenInput.value = s.gistToken || '';
    if (pushTokenInput) pushTokenInput.value = s.pushToken || '';
    if (repoInput) repoInput.value = s.repo || 'wunai-xc/hugo-blog';
    if (idInput) idInput.value = s.gistId || '';
    if (themeSelect) themeSelect.value = s.theme || 'auto';
    if (liveCheck) liveCheck.checked = s.livePreview !== false;
    $('ed-settings-modal').style.display = 'flex';
  }
  function closeSettings() { $('ed-settings-modal').style.display = 'none'; }
  function saveSettingsFromUI() {
    var s = {
      gistToken: ($('ed-gist-token').value || '').trim(),
      pushToken: ($('ed-push-token').value || '').trim(),
      repo: ($('ed-push-repo').value || '').trim(),
      gistId: ($('ed-gist-id').value || '').trim(),
      theme: $('ed-preview-theme').value,
      livePreview: $('ed-live-preview').checked
    };
    saveSettings(s);
    closeSettings();
    setStatus(t('saved'));
  }
  function clearAllDrafts() {
    if (!confirm(t('confirmClear'))) return;
    dbClear().then(function() {
      allDrafts = [];
      newDocument();
      renderFileList('');
      setStatus(t('ready'));
    });
  }

  // ===== 快捷键 =====
  function bindShortcuts() {
    document.addEventListener('keydown', function(e) {
      // 只在编辑器页面生效
      if (!document.getElementById('editor-app')) return;

      var ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S：强制保存
      if (ctrl && e.key === 's') {
        e.preventDefault();
        autoSave();
        return;
      }
      // Ctrl+N：新建
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        newDocument();
        return;
      }
      // Ctrl+B：加粗
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        handleToolbar('bold');
        return;
      }
      // Ctrl+I：斜体
      if (ctrl && e.key === 'i') {
        e.preventDefault();
        handleToolbar('italic');
        return;
      }
      // Ctrl+K：链接
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        handleToolbar('link');
        return;
      }
      // Tab：在 textarea 里插入两个空格
      if (e.key === 'Tab' && document.activeElement === elTextarea) {
        e.preventDefault();
        var ta = elTextarea;
        var start = ta.selectionStart;
        ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = start + 2;
        ta.dispatchEvent(new Event('input'));
      }
    });
  }

  // ===== 小屏 tab 切换 =====
  function bindMobileTabs() {
    document.querySelectorAll('.ed-mobile-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ed-mobile-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.dataset.mtab;
        var sidebar = $('ed-sidebar');
        var editArea = document.querySelector('.editor-edit-area');
        var previewArea = document.querySelector('.editor-preview-area');
        if (sidebar) sidebar.classList.toggle('show', tab === 'files');
        if (editArea) editArea.classList.toggle('show', tab === 'edit');
        if (previewArea) previewArea.classList.toggle('show', tab === 'preview');
      });
    });
  }

  // ===== 初始化 =====
  function init() {
    // 缓存 DOM
    elTitle = $('ed-title');
    elTextarea = $('ed-textarea');
    elPreview = $('ed-preview');
    elStatus = $('ed-status');
    elFileList = $('ed-file-list');
    elSearch = $('ed-search');
    elDraftCount = $('ed-draft-count');
    elPreviewMeta = $('ed-preview-meta');

    // 检查是否有 marked
    if (typeof marked === 'undefined') {
      // 等待 marked CDN 加载
      var checkMarked = setInterval(function() {
        if (typeof marked !== 'undefined') {
          clearInterval(checkMarked);
          initMarked();
          if (elTextarea && elTextarea.value) updatePreview();
        }
      }, 100);
    } else {
      initMarked();
    }

    // 打开数据库
    openDB().then(function() {
      return dbAll();
    }).then(function(drafts) {
      allDrafts = drafts || [];
      renderFileList('');
      if (allDrafts.length > 0) {
        loadDocument(allDrafts[0].id);
      } else {
        // 首次使用：创建一篇示例草稿
        var sample = {
          id: uid(),
          title: LANG === 'en' ? 'Welcome' : '欢迎使用',
          content: LANG === 'en'
            ? '# Welcome\n\nStart writing Markdown here...\n\n- **Bold** and *italic*\n- ~~Strikethrough~~\n- `code`\n\n> Blockquote\n\n```mermaid\nflowchart LR\n    A[Start] --> B[End]\n```\n\n$$E = mc^2$$\n'
            : '# 欢迎使用\n\n在这里开始写 Markdown...\n\n- **加粗** 和 *斜体*\n- ~~删除线~~\n- `代码`\n\n> 引用块\n\n```mermaid\nflowchart LR\n    A[开始] --> B[结束]\n```\n\n$$E = mc^2$$\n',
          updatedAt: Date.now(),
          createdAt: Date.now()
        };
        return dbPut(sample).then(function() {
          allDrafts.unshift(sample);
          loadDocument(sample.id);
          renderFileList('');
        });
      }
    }).catch(function(err) {
      console.error('[editor] init fail', err);
      setStatus('Error: ' + (err.message || err));
    });

    // 绑定事件
    if (elTextarea) {
      elTextarea.addEventListener('input', function() {
        autoSave();
        var settings = getSettings();
        if (settings.livePreview !== false) updatePreview();
        else updateWordCount();
      });
    }
    if (elTitle) {
      elTitle.addEventListener('input', function() { autoSave(); });
    }
    if (elSearch) {
      elSearch.addEventListener('input', function() { renderFileList(elSearch.value); });
    }

    // 顶栏按钮
    var btnNew = $('ed-new');
    if (btnNew) btnNew.addEventListener('click', newDocument);
    var btnDup = $('ed-duplicate');
    if (btnDup) btnDup.addEventListener('click', duplicateCurrent);
    var btnDl = $('ed-download');
    if (btnDl) btnDl.addEventListener('click', exportMarkdown);
    var btnPush = $('ed-gist-push');
    if (btnPush) btnPush.addEventListener('click', gistPush);
    var btnPull = $('ed-gist-pull');
    if (btnPull) btnPull.addEventListener('click', gistPull);
    var btnPublish = $('ed-publish');
    if (btnPublish) btnPublish.addEventListener('click', openPublishModal);

    // 发布弹窗按钮
    var pubClose = $('ed-publish-close');
    if (pubClose) pubClose.addEventListener('click', closePublishModal);
    var pubCancel = $('ed-publish-cancel');
    if (pubCancel) pubCancel.addEventListener('click', closePublishModal);
    var pubPR = $('ed-publish-pr');
    if (pubPR) pubPR.addEventListener('click', function() { doPublish('pr'); });
    var pubMain = $('ed-push-main');
    if (pubMain) pubMain.addEventListener('click', function() { doPublish('main'); });
    // 发布弹窗：表单字段变化实时刷新预览
    ['ed-fm-title','ed-fm-slug','ed-fm-langdir','ed-fm-author','ed-fm-tags','ed-fm-cats','ed-fm-date','ed-fm-summary'].forEach(function(id) {
      var el = $(id);
      if (el) el.addEventListener('input', updatePublishPreview);
    });
    var elDraft = $('ed-fm-draft');
    if (elDraft) elDraft.addEventListener('change', updatePublishPreview);
    // 结果弹窗
    var resClose = $('ed-result-close');
    if (resClose) resClose.addEventListener('click', closeResultModal);
    var resOK = $('ed-result-ok');
    if (resOK) resOK.addEventListener('click', closeResultModal);
    var resModal = $('ed-publish-result-modal');
    if (resModal) resModal.addEventListener('click', function(e) { if (e.target === resModal) closeResultModal(); });
    var publishModal = $('ed-publish-modal');
    if (publishModal) publishModal.addEventListener('click', function(e) { if (e.target === publishModal) closePublishModal(); });

    // 设置
    var btnSettings = $('ed-settings');
    if (btnSettings) btnSettings.addEventListener('click', openSettings);
    var btnSettingsClose = $('ed-settings-close');
    if (btnSettingsClose) btnSettingsClose.addEventListener('click', closeSettings);
    var btnSettingsSave = $('ed-settings-save');
    if (btnSettingsSave) btnSettingsSave.addEventListener('click', saveSettingsFromUI);
    var btnClearAll = $('ed-clear-all');
    if (btnClearAll) btnClearAll.addEventListener('click', clearAllDrafts);

    // 点击模态框外部关闭
    var modal = $('ed-settings-modal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) closeSettings();
      });
    }

    // 工具栏
    document.querySelectorAll('.ed-tool').forEach(function(btn) {
      btn.addEventListener('click', function() {
        handleToolbar(btn.dataset.md);
      });
    });

    bindShortcuts();
    bindMobileTabs();

    // 离开页面前保存
    window.addEventListener('beforeunload', function() {
      if (currentId && elTextarea && elTextarea.value) {
        autoSave();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ======================================================================
  // 新增：Frontmatter 解析 + 组装
  // ======================================================================
  function parseHandwrittenFM(content) {
    // 识别 TOML +++ 开头的 frontmatter（目前全站主流格式），并兼容 YAML --- 开头
    if (!content) return { fm: null, body: content };
    // Windows 换行统一
    var c = content.replace(/\r\n/g, '\n');
    var m1 = c.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n([\s\S]*)$/);
    if (m1) {
      return { fm: { format: 'toml', raw: m1[1] }, body: m1[2] };
    }
    var m2 = c.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (m2) {
      return { fm: { format: 'yaml', raw: m2[1] }, body: m2[2] };
    }
    return { fm: null, body: c };
  }

  // 把一段 TOML 原始文本解析为简单对象（仅支持我们关心的几个字段：title/date/tags/categories/author/draft/summary）
  function parseSimpleToml(raw) {
    if (!raw) return {};
    var lines = raw.split('\n');
    var obj = {};
    lines.forEach(function(line) {
      // 去掉 # 注释
      line = line.replace(/#.*$/, '').trim();
      if (!line) return;
      // key = value
      var idx = line.indexOf('=');
      if (idx < 0) return;
      var k = line.substring(0, idx).trim();
      var v = line.substring(idx + 1).trim();
      // 数组: ["a", "b"] 或 ['a','b']
      var arr = v.match(/^\[\s*(.*)\s*\]$/);
      if (arr) {
        var inner = arr[1];
        if (!inner.trim()) { obj[k] = []; return; }
        // 简单按逗号分割，再剥引号
        obj[k] = inner.split(',').map(function(s) {
          return s.trim().replace(/^["']/,'').replace(/["']$/,'').trim();
        }).filter(function(s){ return s.length > 0; });
        return;
      }
      // 布尔: true / false
      if (v === 'true') { obj[k] = true; return; }
      if (v === 'false') { obj[k] = false; return; }
      // 日期: 2026-08-09 (DATE 字面量不包引号)
      if (/^\d{4}-\d{2}-\d{2}T?/.test(v)) { obj[k] = v; return; }
      // 字符串: "xxx" 或 'xxx' 或 裸字符串数字
      obj[k] = v.replace(/^["']/, '').replace(/["']$/, '').trim();
    });
    return obj;
  }

  function toTOMLStringValue(v) {
    if (v === null || v === undefined) return '""';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    // 日期 (2026-08-09) 不加引号
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return v;
    // 字符串：含引号或反斜杠时简单转义
    var s = String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    return '"' + s + '"';
  }
  function toTOMLArray(arr) {
    if (!Array.isArray(arr)) arr = [];
    if (arr.length === 0) return '[]';
    return '[' + arr.map(function(x) { return toTOMLStringValue(x); }).join(', ') + ']';
  }

  // 组装最终要写入仓库的完整文件文本
  // opts: { title, date, tags, categories, author, draft, summary, contentRaw }
  function composeFileForRepo(opts) {
    var parsed = parseHandwrittenFM(opts.contentRaw || '');
    var body = parsed.body;
    var fmObj;

    if (parsed.fm) {
      // 手写优先：先解析出来，再把用户在发布弹窗里"改过"的字段做 overlay（空字符串/空数组不覆盖）
      fmObj = parseSimpleToml(parsed.fm.raw);
      var overrides = {};
      if (opts.title) overrides.title = opts.title;
      if (opts.date)  overrides.date  = opts.date;
      if (opts.author !== undefined && opts.author !== '') overrides.author = opts.author;
      // 空串表示"用户显式清空 author 字段 → 不写" → undefined
      if (opts.author === '') delete overrides.author;
      if (opts.summary !== undefined && opts.summary !== '') overrides.summary = opts.summary;
      if (opts.tags && opts.tags.length > 0) overrides.tags = opts.tags;
      if (opts.categories && opts.categories.length > 0) overrides.categories = opts.categories;
      // draft 总是跟随弹窗开关（因为用户明确点了"草稿/非草稿"）
      overrides.draft = !!opts.draft;
      Object.assign(fmObj, overrides);
      var src = LANG === 'zh'
        ? ' 正文中已手写 frontmatter，弹窗中修改过的字段会覆盖手写值（未修改的保留手写）。'
        : ' Frontmatter was handwritten; values from publish-dialog override handwritten fields.';
      fmObj.__sourceHint__ = 'handwritten' + src;
    } else {
      fmObj = {
        title: opts.title || '',
        date:  opts.date  || new Date().toISOString().slice(0,10),
        draft: opts.draft !== false,
        __sourceHint__: LANG === 'zh'
          ? '正文没有 frontmatter，已按弹窗表单字段自动生成默认 TOML +++ 头。'
          : 'No frontmatter found in body; auto-generated TOML +++ header from dialog fields.'
      };
      if (opts.author) fmObj.author = opts.author; // 留空则不写 author 字段
      if (opts.summary) fmObj.summary = opts.summary;
      if (opts.tags && opts.tags.length) fmObj.tags = opts.tags;
      if (opts.categories && opts.categories.length) fmObj.categories = opts.categories;
    }

    // 顺序: title / date / draft / author / tags / categories / summary
    var lines = [];
    lines.push('title = ' + toTOMLStringValue(fmObj.title || '未命名'));
    lines.push('date = '  + (fmObj.date ? toTOMLStringValue(fmObj.date) : toTOMLStringValue(new Date().toISOString().slice(0,10))));
    lines.push('draft = ' + (fmObj.draft ? 'true' : 'false'));
    if (fmObj.author !== undefined && fmObj.author !== null && String(fmObj.author).trim() !== '') {
      lines.push('author = ' + toTOMLStringValue(fmObj.author));
    }
    if (Array.isArray(fmObj.tags)) lines.push('tags = ' + toTOMLArray(fmObj.tags));
    if (Array.isArray(fmObj.categories)) lines.push('categories = ' + toTOMLArray(fmObj.categories));
    if (fmObj.summary && String(fmObj.summary).trim()) {
      lines.push('summary = ' + toTOMLStringValue(String(fmObj.summary).trim()));
    }
    return '+++\n' + lines.join('\n') + '\n+++\n\n' + (body || '');
  }

  // ======================================================================
  // 新增：GitHub REST API 封装（contents/git/refs/pulls）
  // ======================================================================
  function ghHeaders(token) {
    return {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  function ghAPI(token, repo, method, path, body) {
    var url = 'https://api.github.com' + path;
    return fetch(url, {
      method: method,
      headers: ghHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(function(r) {
      return r.text().then(function(t) {
        var parsed;
        try { parsed = JSON.parse(t); } catch(e) { parsed = t; }
        if (!r.ok) {
          var msg = (parsed && parsed.message) ? parsed.message : ('HTTP ' + r.status);
          if (parsed && parsed.errors && Array.isArray(parsed.errors)) {
            msg += ' | ' + parsed.errors.map(function(e){ return e.message; }).join('; ');
          }
          var err = new Error(msg);
          err.status = r.status;
          err.raw = parsed;
          throw err;
        }
        return parsed;
      });
    });
  }

  // 获取 main 分支最新 commit SHA
  function getMainHead(token, repo) {
    // /repos/{owner}/{repo}/git/ref/heads/main
    return ghAPI(token, repo, 'GET', '/repos/' + repo + '/git/ref/heads/main').then(function(d) {
      return d.object.sha;
    });
  }

  // 从某个 base SHA 新建分支
  function createBranch(token, repo, branchName, baseSha) {
    return ghAPI(token, repo, 'POST', '/repos/' + repo + '/git/refs', {
      ref: 'refs/heads/' + branchName,
      sha: baseSha
    });
  }

  // 向指定分支写入文件（无文件时创建，有文件时更新）
  function putFile(token, repo, branch, path, contentText, commitMsg, existingSha) {
    var payload = {
      message: commitMsg,
      content: b64EncodeUnicode(contentText),
      branch: branch
    };
    if (existingSha) payload.sha = existingSha;
    return ghAPI(token, repo, 'PUT', '/repos/' + repo + '/contents/' + path, payload);
  }

  // 读取目标分支上文件的现有 SHA（若不存在返回 null）
  function getFileSha(token, repo, branch, path) {
    return ghAPI(token, repo, 'GET', '/repos/' + repo + '/contents/' + path + '?ref=' + encodeURIComponent(branch))
      .then(function(d) { return d.sha || null; })
      .catch(function(err) {
        if (err.status === 404) return null;
        throw err;
      });
  }

  function openPR(token, repo, headBranch, baseBranch, title, body) {
    return ghAPI(token, repo, 'POST', '/repos/' + repo + '/pulls', {
      title: title,
      head: headBranch,
      base: baseBranch || 'main',
      body: body || ''
    });
  }

  function b64EncodeUnicode(str) {
    // UTF-8 → base64，避免中文乱码
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function(b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // ======================================================================
  // 新增：发布模态框业务逻辑
  // ======================================================================
  function slugifyHint(title) {
    if (!title) return '';
    // 不做拼音转换（用户选择了"手动输入 slug"方案）；只做安全字符清洗给默认参考
    var s = String(title).trim()
      .replace(/\s+/g, '-')
      .replace(/[\\/:*?"<>|.，,。！!？?·~`'";()（）【】\[\\]\u2009]+/g, '');
    if (s.length > 60) s = s.slice(0, 60);
    return s;
  }

  function splitCsv(input) {
    if (!input) return [];
    return String(input).split(/[,，]/).map(function(s) { return s.trim(); }).filter(function(s){ return s.length > 0; });
  }

  function openPublishModal() {
    var settings = getSettings();
    var warnEl = $('ed-publish-warn');
    var progEl = $('ed-publish-progress');
    progEl.style.display = 'none';

    // 前置检查
    if (!settings.pushToken) {
      warnEl.style.display = 'block';
      warnEl.innerHTML = LANG === 'zh'
        ? '<b>还没配置 Push Token。</b><br>请去右上角「⚙ 设置」面板填写 <code>GitHub Token (Push)</code>，或点 <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">这里生成 Fine-grained PAT</a>：<br>• Repository access → 只选 wunai-xc/hugo-blog<br>• Permissions → Contents: Read and write；Pull requests: Read and write'
        : '<b>Push Token not set.</b><br>Fill <code>GitHub Token (Push)</code> in ⚙ Settings, or create one <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">here</a>:<br>• Repo access → only wunai-xc/hugo-blog<br>• Permissions → Contents:R/W + Pull requests:R/W';
    } else if (!settings.repo) {
      warnEl.style.display = 'block';
      warnEl.textContent = LANG === 'zh' ? '还没填博客仓库。' : 'Blog repo not set.';
    } else {
      warnEl.style.display = 'none';
    }

    // 预填弹窗表单
    var title = (elTitle ? elTitle.value : '') || extractTitle(elTextarea ? elTextarea.value : '') || '';
    $('ed-fm-title').value = title;
    var slugHint = slugifyHint(title);
    var slugEl = $('ed-fm-slug');
    if (!slugEl.value || slugEl.dataset.autoFill === '1') {
      slugEl.value = slugHint;
      slugEl.dataset.autoFill = '1';
    }
    if (LANG === 'en') $('ed-fm-langdir').value = 'content/en/posts/';
    else $('ed-fm-langdir').value = 'content/zh/posts/';

    // 日期默认今天
    var dateEl = $('ed-fm-date');
    if (!dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);

    // 如果正文里手写了 frontmatter，把值提出来覆盖表单，并在来源 hint 里提示
    var parsed = parseHandwrittenFM(elTextarea ? elTextarea.value : '');
    if (parsed.fm) {
      var fm = parseSimpleToml(parsed.fm.raw);
      if (fm.title)   $('ed-fm-title').value   = fm.title;
      if (fm.author !== undefined)  $('ed-fm-author').value  = fm.author || '';
      if (fm.tags && Array.isArray(fm.tags)) $('ed-fm-tags').value = fm.tags.join(', ');
      if (fm.categories && Array.isArray(fm.categories)) $('ed-fm-cats').value = fm.categories.join(', ');
      if (fm.date)   $('ed-fm-date').value   = String(fm.date).slice(0, 10);
      if (typeof fm.draft === 'boolean') $('ed-fm-draft').checked = fm.draft;
      if (fm.summary) $('ed-fm-summary').value = fm.summary;
      $('ed-fm-source-hint').textContent = LANG === 'zh'
        ? '✅ 正文已手写 +++ frontmatter（识别为 ' + parsed.fm.format.toUpperCase() + '），弹窗修改的字段会覆盖手写值，未修改的保留手写。'
        : '✅ Frontmatter detected (' + parsed.fm.format.toUpperCase() + '). Fields you change here override handwritten values.';
    } else {
      $('ed-fm-source-hint').textContent = LANG === 'zh'
        ? 'ℹ️ 正文没有 frontmatter，发布时会按弹窗字段自动拼接 +++ TOML 头。可随时在正文开头手写 +++ 以精细控制。'
        : 'ℹ️ No frontmatter in body. TOML +++ header will be auto-assembled from dialog fields on publish.';
    }

    updatePublishPreview();

    $('ed-publish-modal').style.display = 'flex';
  }

  function closePublishModal() {
    $('ed-publish-modal').style.display = 'none';
  }

  function closeResultModal() {
    $('ed-publish-result-modal').style.display = 'none';
  }

  function showResult(title, htmlBody) {
    $('ed-result-title').textContent = title;
    $('ed-result-body').innerHTML = htmlBody;
    $('ed-publish-result-modal').style.display = 'flex';
  }

  function updatePublishPreview() {
    var fullText = composeFromModal();
    var pre = $('ed-fm-preview');
    if (pre) pre.textContent = fullText;
  }

  function collectModalOptions() {
    return {
      title: ($('ed-fm-title').value || '').trim(),
      slug:  ($('ed-fm-slug').value  || '').trim(),
      langDir: $('ed-fm-langdir').value,
      author: $('ed-fm-author').value.trim(),
      tags: splitCsv($('ed-fm-tags').value),
      categories: splitCsv($('ed-fm-cats').value),
      date: $('ed-fm-date').value || new Date().toISOString().slice(0,10),
      draft: $('ed-fm-draft').checked,
      summary: $('ed-fm-summary').value.trim(),
      contentRaw: elTextarea ? elTextarea.value : ''
    };
  }

  function composeFromModal() {
    return composeFileForRepo(collectModalOptions());
  }

  function validForPublish() {
    var s = getSettings();
    var msg = null;
    if (!s.pushToken) msg = (LANG==='zh'?'请先在 ⚙ 设置里填 GitHub Token (Push)。':'Set GitHub Token (Push) in Settings first.');
    else if (!s.repo) msg = (LANG==='zh'?'请先在 ⚙ 设置里填博客仓库 (owner/repo)。':'Set blog repo (owner/repo) in Settings first.');
    var opt = collectModalOptions();
    if (!msg && !opt.title) msg = (LANG==='zh'?'标题不能为空。':'Title is required.');
    if (!msg && !opt.slug)  msg = (LANG==='zh'?'文件名 slug 不能为空。':'Filename slug is required.');
    // slug 安全字符
    if (!msg && !/^[\w\u4e00-\u9fff\uff00-\uffef.\-]+$/i.test(opt.slug)) {
      msg = (LANG==='zh'?'文件名只能有中文/英文/数字/横杠/点号，特殊字符请去掉。':'Filename can only contain CJK/en/digits/hyphen/dot.');
    }
    return msg;
  }

  function progress(msg) {
    var el = $('ed-publish-progress');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = '⏳ ' + msg + ' ...';
  }

  function doPublish(mode /* 'pr' | 'main' */) {
    var errMsg = validForPublish();
    if (errMsg) {
      showResult(LANG === 'zh' ? '❌ 校验不通过' : '❌ Validation failed',
        '<p style="color:#ef4444">' + escapeHTML(errMsg) + '</p>');
      return;
    }

    var s = getSettings();
    var token = s.pushToken;
    var repo  = s.repo;
    var opt   = collectModalOptions();
    var path  = opt.langDir + opt.slug + '.md';
    var fileContent = composeFileForRepo(opt);

    // 锁住按钮防止重复点击
    var btnPR   = $('ed-publish-pr');
    var btnMain = $('ed-push-main');
    btnPR.disabled = btnMain.disabled = true;

    var msg = (mode === 'main'
      ? (LANG === 'zh' ? '[直接发布] 新增/更新: ' : '[direct publish] create/update: ')
      : (LANG === 'zh' ? '[草稿 PR] 新增/更新: ' : '[draft PR] create/update: '))
      + path
      + ' (' + (opt.draft ? 'draft=true' : 'draft=false') + ')';

    // 执行
    var chain;
    if (mode === 'main') {
      chain = directPushMain(token, repo, path, fileContent, msg);
    } else {
      chain = openDraftPR(token, repo, path, fileContent, opt.slug, opt.title, msg);
    }

    chain.then(function(result) {
      btnPR.disabled = btnMain.disabled = false;
      closePublishModal();
      showResult(result.title, result.body);
    }).catch(function(err) {
      btnPR.disabled = btnMain.disabled = false;
      progress('');
      showResult(LANG === 'zh' ? '❌ 发布失败' : '❌ Publish failed',
        '<p style="color:#ef4444"><b>' + escapeHTML(err.message || err) + '</b></p>'
        + (err.raw && err.raw.documentation_url ? '<p style="font-size:12px;color:#6b7280">GitHub Docs: ' + escapeHTML(err.raw.documentation_url) + '</p>' : '')
        + '<p style="font-size:12px;color:#6b7280">' + (LANG === 'zh'
          ? '常见原因：<br>① Token 权限不足（需 Contents Read/Write + Pull Requests Read/Write）<br>② Token 已过期/撤销<br>③ 目标文件已存在，需要先手动删或更新 sha（本脚本已自动处理，冲突请重试一次）<br>④ 仓库或分支名拼写错误。'
          : 'Common causes:<br>① Missing Contents:R/W + PRs:R/W permissions<br>② Token expired/revoked<br>③ Conflict (retry once; auto-handles SHA)<br>④ Wrong repo/branch name.')
        + '</p>');
    });
  }

  function directPushMain(token, repo, path, fileContent, commitMsg) {
    progress(LANG === 'zh' ? '读取 main 分支最新状态' : 'Fetching main HEAD');
    return Promise.all([
      getMainHead(token, repo),
      getFileSha(token, repo, 'main', path)
    ]).then(function(vals) {
      var headSha = vals[0], existingSha = vals[1];
      progress((existingSha ? (LANG === 'zh' ? '文件已存在，更新内容' : 'File exists, updating SHA=') + existingSha.slice(0,7)
                         : (LANG === 'zh' ? '文件不存在，创建新文件' : 'File not exists, creating')));
      return putFile(token, repo, 'main', path, fileContent, commitMsg, existingSha || undefined);
    }).then(function(r) {
      var fileUrl = (r && r.content && r.content.html_url)
        || ('https://github.com/' + repo + '/blob/main/' + path);
      var commitUrl = (r && r.commit && r.commit.html_url) || '';
      var actionsUrl = 'https://github.com/' + repo + '/actions';
      return {
        title: LANG === 'zh' ? '✅ 直推 main 成功' : '✅ Pushed to main',
        body: (LANG === 'zh'
          ? '<p>已写入 <code>' + escapeHTML(path) + '</code>，Actions 构建正在自动触发：</p>'
          : '<p>Wrote <code>' + escapeHTML(path) + '</code>. Build is triggering:</p>')
          + '<ul>'
          + '<li>📄 <a href="' + fileUrl + '" target="_blank" rel="noopener">GitHub 查看文件内容</a></li>'
          + (commitUrl ? '<li>🔗 <a href="' + commitUrl + '" target="_blank" rel="noopener">查看 commit</a></li>' : '')
          + '<li>🚀 <a href="' + actionsUrl + '" target="_blank" rel="noopener">GitHub Actions 构建日志</a>（约 2-3 分钟后 Cloudflare Pages 自动上线）</li>'
          + '</ul>'
      };
    });
  }

  function openDraftPR(token, repo, path, fileContent, slug, title, commitMsg) {
    var ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0,12);
    var safeBranch = slug.replace(/[^A-Za-z0-9_-]/g,'').slice(0,40) || 'untitled';
    var branchName = 'draft/' + safeBranch + '-' + ts;

    progress(LANG === 'zh' ? '读取 main HEAD + 目标文件信息' : 'Fetch main HEAD and target file');
    return Promise.all([
      getMainHead(token, repo),
      getFileSha(token, repo, 'main', path)
    ]).then(function(vals) {
      var headSha = vals[0], existingSha = vals[1];
      progress((LANG === 'zh' ? '创建分支 ' : 'Creating branch ') + branchName);
      return createBranch(token, repo, branchName, headSha).then(function() {
        progress((LANG === 'zh' ? '写入文件到分支 ' : 'Writing file to branch ') + branchName);
        return putFile(token, repo, branchName, path, fileContent, commitMsg, existingSha || undefined);
      }).then(function() {
        var prTitle = (LANG === 'zh' ? '[草稿] ' : '[Draft] ') + (title || slug || 'New post');
        var prBody  = LANG === 'zh'
          ? '✅ 由编辑器草稿自动创建。合并后自动触发 Actions 构建。\n\n变更文件：`' + path + '`'
          : '✅ Auto-created from editor drafts. Merging will trigger Actions build.\n\nChanges: `' + path + '`';
        progress(LANG === 'zh' ? '开 Pull Request' : 'Opening Pull Request');
        return openPR(token, repo, branchName, 'main', prTitle, prBody);
      });
    }).then(function(pr) {
      var url = (pr && pr.html_url) || ('https://github.com/' + repo + '/pulls');
      var diffUrl = url;
      var actionsUrl = 'https://github.com/' + repo + '/actions';
      return {
        title: LANG === 'zh' ? '✅ PR 已创建' : '✅ PR Opened',
        body: (LANG === 'zh'
          ? '<p>草稿分支 <code>' + escapeHTML(branchName) + '</code> 已创建并开 PR：</p>'
          : '<p>Draft branch <code>' + escapeHTML(branchName) + '</code> created. PR opened:</p>')
          + '<ul>'
          + '<li>🔗 <a href="' + url + '" target="_blank" rel="noopener"><b>在 GitHub 审阅合并 →</b></a></li>'
          + '<li>🚀 <a href="' + actionsUrl + '" target="_blank" rel="noopener">合并后 Actions 构建日志</a>（合并后约 2-3 分钟上线）</li>'
          + '<li>📝 文件：<code>' + escapeHTML(path) + '</code></li>'
          + '</ul>'
      };
    });
  }

  // 重写 saveSettingsFromUI / openSettings：支持新字段 pushToken + repo —— 已在上方原函数处直接修改，无需额外劫持。
})();
