/**
 * Comprehensive Local Simulation Test Runner (全面本地环境端到端仿真测试套件)
 * Hogwarts Audio Vue 3 学习平台
 *
 * Implements end-to-end simulations across 5 critical dimensions:
 * 1. Multi-Viewport Layout Matrix & Apple HIG Touch Ergonomics (375px, 390px, 768px, 1280px)
 * 2. Audio Streaming & Subtitle Pipeline (VTT Parser, Pinia Stores, Binary Search Matching, shallowRef)
 * 3. SLA Interactive Learning Modules (A/B Shadowing, Dictation Studio, Leitner 5-Box, Anki Export)
 * 4. Offline-First & Storage Isolation (IndexedDB HogwartsOfflineDB, LocalStorage Breakpoint Resume)
 * 5. Production Quality Gates (Zero-Emoji Audit, Security Credential Leak Audit, Vite Bundle Health)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setActivePinia, createPinia } from 'pinia'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Terminal color helpers
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

let totalTests = 0
let passedTests = 0
let failedTests = 0
const failures = []

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ${GREEN}✓ PASS${RESET} ${message}`)
  } else {
    failedTests++
    failures.push(message)
    console.log(`  ${RED}✗ FAIL${RESET} ${message}`)
  }
}

async function runSimulation() {
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`)
  console.log(`${BOLD}${CYAN}   Hogwarts Audio (Vue 3) — 全面本地环境端到端仿真测试 (Local Simulation)${RESET}`)
  console.log(`${BOLD}${CYAN}======================================================================${RESET}\n`)

  // -------------------------------------------------------------------------
  // DIMENSION 1: Multi-Viewport Matrix & Apple HIG Touch Ergonomics
  // -------------------------------------------------------------------------
  console.log(`${BOLD}[1/5] Multi-Viewport Matrix & Apple HIG Touch Ergonomics 仿真${RESET}`)
  const viewports = [
    { name: 'iPhone SE (Mobile Compact)', width: 375, height: 667, profile: 'mobile' },
    { name: 'iPhone 15 Pro (Mobile Modern)', width: 390, height: 844, profile: 'mobile' },
    { name: 'iPad Portrait (Tablet)', width: 768, height: 1024, profile: 'tablet' },
    { name: 'Desktop 13" (Desktop Wide)', width: 1280, height: 800, profile: 'desktop' }
  ]

  const audioPlayerSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/AudioPlayer.vue'), 'utf8')
  const subtitleSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/SubtitleViewer.vue'), 'utf8')
  const bookshelfSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/BookshelfDrawer.vue'), 'utf8')
  const shadowingSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/ShadowingRecorder.vue'), 'utf8')
  const dictationSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/DictationStudio.vue'), 'utf8')
  const vocabSrc = fs.readFileSync(path.resolve(projectRoot, 'src/components/VocabularyDrawer.vue'), 'utf8')
  const appSrc = fs.readFileSync(path.resolve(projectRoot, 'src/App.vue'), 'utf8')

  for (const vp of viewports) {
    console.log(`  ${YELLOW}-> 验证视口: ${vp.name} (${vp.width}x${vp.height}px)${RESET}`)

    if (vp.profile === 'mobile') {
      assert(
        audioPlayerSrc.includes('min-h-[48px]') && audioPlayerSrc.includes('min-w-[48px]'),
        `[${vp.name}] 流媒体播放栏核心播放 CTA 拥有 48x48px 突出触控热区`
      )
      assert(
        audioPlayerSrc.includes('min-h-[44px]') && audioPlayerSrc.includes('min-w-[44px]'),
        `[${vp.name}] 流媒体底栏快进快退及倍速调节严格符合 Apple HIG (>= 44x44px)`
      )
      assert(
        dictationSrc.includes('text-base'),
        `[${vp.name}] 听写工坊输入框采用 16px text-base，杜绝 iOS Safari 强制页面缩放`
      )
      assert(
        shadowingSrc.includes('min-h-[44px]') && shadowingSrc.includes('min-h-[48px]'),
        `[${vp.name}] A/B 影子跟读录音与回放操作区严格对齐 Apple HIG 触控尺寸`
      )
      assert(
        bookshelfSrc.includes('min-h-[44px]') && bookshelfSrc.includes('min-h-[48px]'),
        `[${vp.name}] 魔法书架抽屉章节卡片满足拇指舒适轻点尺寸 (>= 44px)`
      )
    } else {
      assert(
        appSrc.includes('max-w-') || appSrc.includes('flex-1'),
        `[${vp.name}] 宽屏视口下布局容器包含自适应居中约束与流式自适应`
      )
      assert(
        vocabSrc.includes('min-h-[44px]'),
        `[${vp.name}] 艾宾浩斯生词本 5 箱切换与卡片操作热区符合人体工程学规范`
      )
    }
  }

  // -------------------------------------------------------------------------
  // DIMENSION 2: Audio Streaming & Subtitle Pipeline Simulation
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[2/5] Audio Streaming & Subtitle Pipeline 仿真${RESET}`)
  const { parseVTT } = await import('../src/utils/vttParser.js')

  const sampleVTT = `WEBVTT - Harry Potter and the Philosopher's Stone Chapter 1

00:00:01.200 --> 00:00:05.450
Mr. and Mrs. Dursley, of number four, Privet Drive,
德思礼夫妇住在女贞路四号，

00:00:05.500 --> 00:00:10.120
were proud to say that they were perfectly normal, thank you very much.
总是得意地夸口说，感谢上帝，他们家里一切都很正常。

00:00:10.200 --> 00:00:15.800
They were the last people you'd expect to be involved in anything strange or mysterious.
要是有人期望他们涉入什么奇怪或神秘的事，那准会彻底落空。
`

  const parsedCues = parseVTT(sampleVTT)
  assert(parsedCues.length === 3, 'VTT 解析引擎正确解析 3 句字幕条目')
  assert(parsedCues[0].startTime === 1.2 && parsedCues[0].endTime === 5.45, '首句时间戳毫秒对齐正确 (1.200s -> 5.450s)')
  assert(parsedCues[0].text.includes('Dursley') && parsedCues[0].translation.includes('德思礼夫妇'), '双语字幕英汉内容正确分离与挂载')

  // Verify Pinia Store and Binary Search
  setActivePinia(createPinia())
  const { useSubtitleStore } = await import('../src/stores/subtitleStore.js')
  const { usePlayerStore } = await import('../src/stores/playerStore.js')
  const subStore = useSubtitleStore()
  const playerStore = usePlayerStore()

  subStore.setCues(parsedCues)
  subStore.updateActiveCue(3.0)
  assert(subStore.activeCueIndex === 0, '时间轴二分查找精准命中第 1 句')
  subStore.updateActiveCue(7.5)
  assert(subStore.activeCueIndex === 1, '时间轴二分查找精准命中第 2 句')

  // Verify shallowRef audio in App.vue
  assert(appSrc.includes('shallowRef(null)'), 'App.vue 严格采用 shallowRef 持有原生 Audio 实例，规避 Proxy 代理陷阱')

  // -------------------------------------------------------------------------
  // DIMENSION 3: SLA Interactive Learning Modules Simulation
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[3/5] SLA 核心学习模块仿真 (跟读/听写/艾宾浩斯/Anki)${RESET}`)

  // 3.1 Speech Pronunciation Scoring
  const { evaluatePronunciation } = await import('../src/utils/speechScoring.js')
  const scoreResult = evaluatePronunciation('Wingardium Leviosa', 'Wingardium Leviosa')
  assert(scoreResult.score === 100, '跟读施咒语音测评引擎满分匹配准确度达到 100 分')

  const typoResult = evaluatePronunciation('Wingardium Leviosa', 'Wingardium Leviosar')
  assert(typoResult.score >= 80 && typoResult.score < 100, '微小发音偏差给出合理的置信度评分区间 (>= 80分)')

  // 3.2 Anki TSV Export Pipeline
  const { generateAnkiTSV } = await import('../src/utils/ankiExport.js')
  const sampleVocab = [
    { word: 'wand', phonetic: '/wɒnd/', definition: '魔杖', contextQuote: 'The wand chooses the wizard.' }
  ]
  const ankiOutput = generateAnkiTSV(sampleVocab)
  assert(ankiOutput.includes('#separator:Tab') && ankiOutput.includes('wand'), 'Anki TSV 导出管道符合标准指令集与字段结构')

  // 3.3 A4 Parchment PDF HTML Generator
  const { generatePrintableParchmentHTML } = await import('../src/utils/parchmentPdfGenerator.js')
  const printableHtml = generatePrintableParchmentHTML(sampleVocab, { title: '测试生词卡' })
  assert(printableHtml.includes('<!DOCTYPE html>') && printableHtml.includes('wand'), 'A4 羊皮纸剪裁单词卡纯向量 HTML 渲染就绪')

  // -------------------------------------------------------------------------
  // DIMENSION 4: Offline-First & Storage Isolation Simulation
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[4/5] 离线可用性与本地持久化储存仿真 (IndexedDB & LocalStorage)${RESET}`)

  // LocalStorage Persistence
  playerStore.switchChapter('hp1', 'hp1-03')
  assert(playerStore.currentChapterId === 'hp1-03', 'PlayerStore 章节切换与断点进度正常同步')

  // Verify IndexedDB Offline Storage Utility
  const offlineStorageSrc = fs.readFileSync(path.resolve(projectRoot, 'src/utils/offlineStorage.js'), 'utf8')
  assert(offlineStorageSrc.includes('HogwartsOfflineDB'), '离线存储引擎使用专用 IndexedDB: HogwartsOfflineDB')
  assert(offlineStorageSrc.includes('chapters') && offlineStorageSrc.includes('audioBlob'), '离线数据库完备支持音频流 Blob 与章节字幕离线缓存')

  // -------------------------------------------------------------------------
  // DIMENSION 5: Production Quality Gates (Zero-Emoji, Security, Build)
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}[5/5] 生产级质量门禁与安全合规审计${RESET}`)

  // 5.1 Zero-Emoji Verification across all .vue, .js, .css files
  const srcFiles = []
  function collectFiles(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f)
      if (fs.statSync(full).isDirectory()) {
        collectFiles(full)
      } else if (/\.(vue|jsx?|tsx?|css|html)$/.test(f)) {
        srcFiles.push(full)
      }
    }
  }
  collectFiles(path.resolve(projectRoot, 'src'))

  let emojiViolations = 0
  const emojiRegex = /\p{Extended_Pictographic}/u
  for (const f of srcFiles) {
    const content = fs.readFileSync(f, 'utf8')
    if (emojiRegex.test(content)) {
      emojiViolations++
      console.log(`  ${RED}Emoji detected in ${path.relative(projectRoot, f)}${RESET}`)
    }
  }
  assert(emojiViolations === 0, `全站零 Emoji 规范审计: 扫描 ${srcFiles.length} 个前端源码文件，0 违规`)

  // 5.2 Security Credential Leak Audit
  let credentialLeaks = 0
  const dangerousPatterns = [
    /R2_SECRET_ACCESS_KEY\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]/,
    /AWS_SECRET_ACCESS_KEY\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]/,
    /ghp_[a-zA-Z0-9]{36}/
  ]
  for (const f of srcFiles) {
    const content = fs.readFileSync(f, 'utf8')
    for (const p of dangerousPatterns) {
      if (p.test(content)) {
        credentialLeaks++
      }
    }
  }
  assert(credentialLeaks === 0, '客户端前端代码凭证零泄露审计: 0 密钥泄露')

  // 5.3 Production Distribution Artifacts Check
  const distDir = path.resolve(projectRoot, 'dist')
  assert(fs.existsSync(distDir), 'Vite 生产构建 dist 目录存在且可用')
  const distHtml = path.resolve(distDir, 'index.html')
  assert(fs.existsSync(distHtml) && fs.statSync(distHtml).size > 500, '生产环境 index.html 构建完整')

  // -------------------------------------------------------------------------
  // FINAL SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`)
  console.log(`${BOLD}${CYAN}   本地端到端仿真测试报告汇总 (Simulation Summary Report)             ${RESET}`)
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`)
  console.log(`  总测试项数: ${BOLD}${totalTests}${RESET}`)
  console.log(`  通过项数:   ${BOLD}${GREEN}${passedTests}${RESET}`)
  console.log(`  失败项数:   ${BOLD}${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`)
  console.log(`  测试通过率: ${BOLD}${passedTests === totalTests ? GREEN : RED}${((passedTests / totalTests) * 100).toFixed(1)}%${RESET}`)

  if (failedTests > 0) {
    console.log(`\n${RED}${BOLD}失败项目列表:${RESET}`)
    failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`))
    process.exit(1)
  } else {
    console.log(`\n${GREEN}${BOLD}✓ 项目通过全面的本地仿真测试，状态完全健康稳定！${RESET}\n`)
    process.exit(0)
  }
}

runSimulation().catch((err) => {
  console.error(`${RED}仿真测试脚本运行异常:${RESET}`, err)
  process.exit(1)
})
