import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * GitHub Pages 는 `https://<계정>.github.io/ai_app/` 하위 경로로 서빙한다.
 *
 * 개발 서버만 루트(`/`)로 두고 싶은 유혹이 있지만 그렇게 하지 않는다.
 * 개발에서만 통하는 절대 경로를 써도 눈치채지 못하고, 배포한 뒤에야 404 로
 * 발견하게 되기 때문이다. dev·preview·build 가 전부 같은 base 를 쓰면
 * 그 부류의 버그가 아예 생기지 않는다.
 *
 * 그래서 개발 서버 주소도 http://localhost:5173/ai_app/ 이다.
 * 루트로 서빙하는 곳(Vercel 등)에 올릴 때는 `BASE_PATH=/` 로 덮어쓴다.
 *
 * 코드에서 public/ 파일을 가리킬 때는 절대 경로 대신
 * `import.meta.env.BASE_URL` 을 앞에 붙일 것.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/ai_app/',
  plugins: [react(), tailwindcss()],
})
