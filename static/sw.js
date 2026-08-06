/* ==========================================================================
 * wunai's blog Service Worker
 * 实现：断网离线可访问 + 已访问页面永久缓存 + 静态资源 Cache First
 * 每次修改此文件需更新 CACHE_VERSION，用户会自动激活新版本
 * ========================================================================== */

const CACHE_VERSION = 'v1.0.1-20260806';
const STATIC_CACHE  = `static-${CACHE_VERSION}`;   // CSS/JS/图片/字体（长缓存）
const PAGES_CACHE   = `pages-${CACHE_VERSION}`;    // 访问过的 HTML 页面
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;  // 其他运行时资源

// 预缓存的核心资源（Service Worker 激活时就缓存）
const PRECACHE_URLS = [
  '/',
  '/zh/',
  '/en/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

// 这些 CDN 域名允许被缓存（外链资源，断网时也能复用）
const ALLOWED_CDN_ORIGINS = new Set([
  'cdn.jsdelivr.net',
]);

/* ----------------------------- 安装：预缓存 ----------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // 预缓存核心资源（单个失败不影响整体）
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { credentials: 'same-origin', cache: 'reload' })
            .then((res) => {
              if (res.ok) cache.put(url, res.clone());
            })
            .catch(() => { /* 个别失败忽略 */ })
        )
      );
    }).then(() => self.skipWaiting()) // 立即激活，不等旧 SW 退出
  );
});

/* --------------------------- 激活：清理旧缓存 --------------------------- */
self.addEventListener('activate', (event) => {
  const currentCaches = new Set([STATIC_CACHE, PAGES_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !currentCaches.has(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // 立即接管所有页面
  );
});

/* ------------------------- 消息：立即跳过等待激活 ------------------------ */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ------------------------------ 请求拦截 ------------------------------ */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 非 http/https（如 chrome-extension://）直接放行
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 同站 HTML 导航请求 → Stale While Revalidate：先给缓存，后台异步刷新
  if (req.mode === 'navigate' && url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(req, PAGES_CACHE));
    return;
  }

  // 静态资源（CSS/JS/图片/字体）→ Stale While Revalidate
  // 说明：原先使用 Cache First 会导致带新 hash 的 CSS/JS 永远不被请求（旧HTML引用旧路径被命中），
  // 尤其是移动端首次安装 SW 后缓存了一份"坏CSS"（rel=preload stylesheet 兼容问题导致），
  // 会一直被锁死无法自愈。改为 SWR：每次命中缓存后，后台仍会异步拉取最新版本，
  // 下次访问即可使用新版本，兼顾离线可用性与自动更新能力。
  if (isStaticAsset(url, req)) {
    if (url.origin === location.origin) {
      // PaperMod 带 hash 的 css/js（路径含 /assets/css/ 或 /assets/js/）用 SWR，
      // 图片/字体等纯静态资源仍 Cache First（体积大且内容稳定）
      if (/\/assets\/(css|js)\//.test(url.pathname)) {
        event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
      } else {
        event.respondWith(cacheFirst(req, STATIC_CACHE));
      }
    } else if (ALLOWED_CDN_ORIGINS.has(url.hostname)) {
      event.respondWith(networkFirst(req, RUNTIME_CACHE));
    }
    return;
  }

  // 同站其他资源：离线回退
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // 成功响应异步缓存
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});

/* ----------------------------- 缓存策略函数 ----------------------------- */

/** Cache First：命中缓存就用缓存，否则网络请求（静态资源用） */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(cacheName).then((c) => c.put(request, clone));
    }
    return res;
  } catch (e) {
    // 离线且无缓存：导航请求回离线页，其他直接抛错
    if (request.mode === 'navigate') {
      return offlineFallback();
    }
    throw e;
  }
}

/** Stale While Revalidate：先给缓存，后台异步更新（页面 HTML 用） */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 后台异步拉取最新版本（不阻塞响应）
  const fetchPromise = fetch(request, { credentials: 'same-origin' })
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => { /* 离线时静默失败 */ });

  if (cached) {
    // 有缓存：立即返回，后台悄悄更新
    fetchPromise.then();
    return cached;
  }

  // 无缓存：等网络返回
  try {
    return await fetchPromise;
  } catch (e) {
    return offlineFallback();
  }
}

/** Network First：优先网络，失败回退缓存（外链 CDN 用） */
async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const clone = res.clone();
      caches.open(cacheName).then((c) => c.put(request, clone));
    }
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 三方 CDN 无缓存也离线，直接抛错
    throw e;
  }
}

/** 离线回退页面（没缓存且断网时显示） */
async function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>离线 · wunai's blog</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg,#f5f5f5);color:var(--fg,#1f2937);padding:24px;text-align:center}
  @media(prefers-color-scheme:dark){body{--bg:#1a1a1e;--fg:#d1d5db}}
  .card{max-width:420px}
  .emoji{font-size:56px;margin-bottom:16px}
  h1{font-size:22px;margin-bottom:12px}
  p{font-size:15px;line-height:1.7;color:var(--fg2,#6b7280);margin-bottom:24px}
  .tips{font-size:13px;color:var(--fg2,#6b7280);opacity:.8}
  .btn{display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500}
</style>
</head>
<body>
  <div class="card">
    <div class="emoji">📡</div>
    <h1>当前无网络连接</h1>
    <p>此页面尚未缓存，无法离线访问。<br>请连接网络后再试，或返回已访问过的页面。</p>
    <a class="btn" href="/zh/">返回首页</a>
    <div class="tips" style="margin-top:24px">
      💡 之前打开过的页面在离线模式下可正常访问
    </div>
  </div>
</body>
</html>`,
    {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

/* ------------------------------ 工具函数 ------------------------------ */

/** 判断是否为静态资源（CSS/JS/图片/字体/图标/音视频等） */
function isStaticAsset(url, request) {
  const staticExts = /\.(css|js|mjs|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|mp4|webm|ogg|mp3|wav|json|xml|rss)(\?|#|$)/i;
  if (staticExts.test(url.pathname)) return true;

  // PaperMod 带 hash fingerprint 的资源路径也算
  if (/\/assets\/(css|js)\//.test(url.pathname)) return true;
  if (/\/images\//.test(url.pathname)) return true;

  // Accept 头判断
  const accept = request.headers.get('accept') || '';
  if (accept.startsWith('image/') || accept.startsWith('font/')) return true;
  if (accept.includes('text/css') || accept.includes('application/javascript')) return true;

  return false;
}
