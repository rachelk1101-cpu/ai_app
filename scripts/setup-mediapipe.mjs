/**
 * MediaPipe 런타임과 모델을 public/ 에 준비한다.
 *
 * 이 파일들을 git 에 넣지 않는 이유는 합쳐서 40MB 가 넘는 바이너리이고,
 * 둘 다 다시 만들어 낼 수 있기 때문이다. WASM 은 이미 의존성으로 받은
 * node_modules 에서 복사하고, 모델은 고정된 공개 주소에서 받는다.
 *
 * 그런데도 CDN 을 그대로 쓰지 않고 굳이 public/ 에 두는 것은,
 * 대회장처럼 네트워크를 믿을 수 없는 곳에서도 앱이 그대로 돌아가야 하고
 * 카메라 프레임이 외부로 나가는 경로를 아예 만들지 않기 위해서다.
 *
 * predev / prebuild 에서 자동으로 돌고, 이미 있으면 아무것도 하지 않는다.
 */
import { cp, mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'public', 'mediapipe')

const WASM_SOURCE = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const MODEL_FILE = path.join(target, 'pose_landmarker_lite.task')

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  await mkdir(target, { recursive: true })

  const wasmTarget = path.join(target, 'wasm')
  if (await exists(path.join(wasmTarget, 'vision_wasm_internal.wasm'))) {
    console.log('mediapipe: wasm 준비됨')
  } else if (await exists(WASM_SOURCE)) {
    await cp(WASM_SOURCE, wasmTarget, { recursive: true })
    console.log('mediapipe: wasm 복사 완료')
  } else {
    console.error('mediapipe: node_modules 에서 wasm 을 찾지 못했습니다. npm install 을 먼저 하세요.')
    process.exitCode = 1
    return
  }

  if (await exists(MODEL_FILE)) {
    console.log('mediapipe: 모델 준비됨')
    return
  }

  console.log('mediapipe: 모델 내려받는 중...')
  const response = await fetch(MODEL_URL)
  if (!response.ok) {
    console.error(`mediapipe: 모델을 받지 못했습니다 (HTTP ${response.status})`)
    process.exitCode = 1
    return
  }
  await writeFile(MODEL_FILE, Buffer.from(await response.arrayBuffer()))
  console.log('mediapipe: 모델 준비 완료')
}

await main()
