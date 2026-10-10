/* localStorage 래퍼 — 키는 jaytools.uigallery.v1.* (같은 file:// 출처를 쓰는 다른 JayTools 도구와 충돌 방지) */
const NS = 'jaytools.uigallery.v1.'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
  } catch {
    /* 사생활 보호 모드 등 — 저장 실패는 무시 */
  }
}
