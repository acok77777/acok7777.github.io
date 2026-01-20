const CACHE_NAME = "ymg-cache-v6"; // ✅ 수정할 때마다 v 숫자 올리기

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// ✅ 네트워크 우선 + 성공하면 캐시에 저장
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // (중요) 크롬 확장/비HTTP 요청 등은 그냥 통과
  if (!req.url.startsWith("http")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // ✅ HTML(문서)은 무조건 최신 우선 (캐시로 고정되는 것 방지)
    const isHTML =
      req.mode === "navigate" ||
      (req.headers.get("accept") || "").includes("text/html");

    if (isHTML) {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        // 최신 문서도 캐시에 저장해두면 오프라인에서 마지막 성공본이라도 뜸
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await cache.match(req);
        return cached || Response.error();
      }
    }

    // ✅ 이미지/JS/CSS 등은: 네트워크 성공하면 캐시 갱신, 실패하면 캐시
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await cache.match(req);
      return cached || Response.error();
    }
  })());
});

// 페이지에서 강제 업데이트 신호 받기
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
