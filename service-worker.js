const CACHE_NAME = "ymg-cache-v5"; // ← 수정할 때마다 숫자 올리기!

self.addEventListener("install", (event) => {
  self.skipWaiting(); // 즉시 새 버전 활성화
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 이전 캐시 전부 삭제
          }
        })
      );
      await self.clients.claim(); // 열린 탭들 즉시 제어
    })()
  );
});

/*
🔥 핵심
- 항상 네트워크 우선
- 실패할 때만 캐시 사용
- 옛날 파일 고정 현상 방지
*/
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(event.request, {
          cache: "no-store"
        });
        return fresh;
      } catch (e) {
        return caches.match(event.request);
      }
    })()
  );
});

// 페이지에서 강제 업데이트 신호 받기
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
