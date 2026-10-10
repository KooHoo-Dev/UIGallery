/* 강의실 환경 점검 — WebGL 가능 여부, GPU 이름 */
export interface EnvInfo {
  webgl: boolean
  renderer: string
}

let cached: EnvInfo | null = null

export function getEnv(): EnvInfo {
  if (cached) return cached
  let webgl = false
  let renderer = '알 수 없음'
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (gl) {
      webgl = true
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl = false
  }
  cached = { webgl, renderer }
  return cached
}
