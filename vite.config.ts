import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Vercel 은 도메인 루트로 서빙하므로 base 는 `/` 이다.
 *
 * 하위 경로로 서빙하는 곳(GitHub Pages 의 `/<저장소>/` 같은)에 올릴 때는
 * BASE_PATH 로 덮어쓴다. 개발 서버까지 같은 base 를 쓰게 해서, 개발에서만
 * 통하는 경로를 써 놓고 배포 후에야 404 로 발견하는 일을 막는다.
 *
 * 코드에서 public/ 파일을 가리킬 때는 절대 경로 대신
 * `import.meta.env.BASE_URL` 을 앞에 붙일 것.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
