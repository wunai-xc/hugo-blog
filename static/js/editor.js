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
    var idInput = $('ed-gist-id');
    var themeSelect = $('ed-preview-theme');
    var liveCheck = $('ed-live-preview');
    if (tokenInput) tokenInput.value = s.gistToken || '';
    if (idInput) idInput.value = s.gistId || '';
    if (themeSelect) themeSelect.value = s.theme || 'auto';
    if (liveCheck) liveCheck.checked = s.livePreview !== false;
    $('ed-settings-modal').style.display = 'flex';
  }
  function closeSettings() { $('ed-settings-modal').style.display = 'none'; }
  function saveSettingsFromUI() {
    var s = {
      gistToken: ($('ed-gist-token').value || '').trim(),
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
})();
