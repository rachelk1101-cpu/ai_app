/**
 * 빌드해서 gh-pages 브랜치에 올린다. `npm run deploy` 한 줄이면 된다.
 *
 * GitHub Actions 워크플로를 쓰지 않는 이유는, 워크플로 파일을 push 하려면
 * 토큰에 `workflow` 스코프가 따로 있어야 하는데 그걸 받는 과정이 번거롭기
 * 때문이다. 결과물만 브랜치에 올리면 그 권한이 필요 없다.
 *
 * 대신 자동 배포는 되지 않는다. 코드를 고친 뒤에는 이 명령을 직접 실행해야 한다.
 */
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const BRANCH = 'gh-pages'

function git(args, cwd = root) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

function step(message) {
  console.log(`\n▶ ${message}`)
}

// 올릴 것이 무엇인지 분명히 해 둔다. 커밋하지 않은 변경이 있으면 알려는 주되,
// 막지는 않는다 — 급할 때 고친 것을 바로 올려 보는 일이 실제로 생긴다.
const dirty = git(['status', '--porcelain'])
if (dirty) {
  console.log('! 커밋하지 않은 변경이 있습니다. 지금 작업 트리 그대로 배포합니다.')
}

const remote = git(['remote', 'get-url', 'origin'])
const sha = git(['rev-parse', '--short', 'HEAD'])

step('빌드 (GitHub Pages 경로로)')
execFileSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, BASE_PATH: process.env.BASE_PATH ?? '/ai_app/' },
})

// Jekyll 이 밑줄로 시작하는 파일·폴더를 건너뛰는 것을 막는다.
writeFileSync(path.join(dist, '.nojekyll'), '')

step(`${BRANCH} 브랜치로 올리는 중`)
// dist 안에 일회용 저장소를 만들어 통째로 덮어쓴다. 이력을 남길 이유가 없고,
// 남기지 않으면 42MB 짜리 결과물이 저장소에 쌓이지도 않는다.
rmSync(path.join(dist, '.git'), { recursive: true, force: true })
git(['init', '-q'], dist)
git(['checkout', '-q', '-b', BRANCH], dist)
git(['add', '-A'], dist)
git(['commit', '-q', '-m', `배포: ${sha}`], dist)
git(['push', '-q', '-f', remote, `${BRANCH}:${BRANCH}`], dist)
rmSync(path.join(dist, '.git'), { recursive: true, force: true })

const slug = remote.replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '')
const [owner, repo] = slug.split('/')
console.log(`\n✓ 올렸습니다 (${sha})`)
console.log(`  https://${owner}.github.io/${repo}/`)
console.log('  반영까지 1~2분 걸립니다.')
