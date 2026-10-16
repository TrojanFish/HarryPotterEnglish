import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('RecommendationCard.vue Component Standards & Implementation', () => {
  const filePath = path.resolve('src/components/home/RecommendationCard.vue')

  test('1. RecommendationCard.vue exists and is a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/home/RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  test('2. Strict Design System: Zero Unicode emojis anywhere', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.strictEqual(rangeRegex.test(content), false, 'Must contain zero Unicode emoji in range')
  })

  test('3. Apple HIG 44px touch targets and tactile feedback ergonomics', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Apple HIG: min-h-[44px], min-w-[44px]
    assert.ok(content.includes('min-h-[44px]'), 'Buttons must enforce Apple HIG min-h-[44px]')
    assert.ok(content.includes('min-w-[44px]'), 'Buttons must enforce Apple HIG min-w-[44px]')
    assert.ok(content.includes('touch-manipulation'), 'Interactive buttons must include touch-manipulation class')
    assert.ok(content.includes('active:scale-95') || content.includes('active:scale-[0.98]'), 'Buttons must include active scale micro-interaction')
    assert.ok(content.includes('aria-label='), 'Interactive buttons must declare aria-label')
  })

  test('4. Warm parchment design system and responsive dual-card grid', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Parchment tokens
    assert.ok(
      content.includes('#fbf9f5') || content.includes('#faf6ee') || content.includes('bg-stone-50'),
      'Must use warm parchment background'
    )
    assert.ok(
      content.includes('#e8ddd0') || content.includes('border-amber') || content.includes('border-stone-200'),
      'Must use parchment border accent'
    )

    // Responsive dual-card grid
    assert.ok(content.includes('grid-cols-1'), 'Must use single column grid for mobile')
    assert.ok(content.includes('md:grid-cols-2') || content.includes('sm:grid-cols-2'), 'Must use 2-column grid on desktop/tablet')
  })

  test('5. Props and Emits interface', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Props: showHeader with default true
    assert.ok(content.includes('showHeader'), 'Must declare showHeader prop')
    assert.ok(content.includes('Boolean'), 'showHeader must be of Boolean type')

    // Emits: open-chapter and open-ted
    assert.ok(content.includes("'open-chapter'"), "Must declare 'open-chapter' emit")
    assert.ok(content.includes("'open-ted'"), "Must declare 'open-ted' emit")
  })

  test('6. Store integration and reactive recommendation computation', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Recommendation Engine import
    assert.ok(
      content.includes('computeNextStepRecommendation'),
      'Must import computeNextStepRecommendation from recommendationEngine.js'
    )

    // Stores imports
    assert.ok(content.includes('useAnalyticsStore'), 'Must import useAnalyticsStore')
    assert.ok(content.includes('useVocabStore'), 'Must import useVocabStore')
    assert.ok(content.includes('useCatalogStore'), 'Must import useCatalogStore')
    assert.ok(content.includes('useNavigationStore'), 'Must import useNavigationStore')

    // Reactive input bindings
    assert.ok(content.includes('cefrLevel'), 'Must pass cefrLevel to computeNextStepRecommendation')
    assert.ok(content.includes('totalListeningSeconds'), 'Must pass totalListeningSeconds')
    assert.ok(content.includes('shadowingAverage'), 'Must pass shadowingAverage')
    assert.ok(content.includes('vocabList'), 'Must pass vocabList')
    assert.ok(content.includes('completedChapters'), 'Must pass completedChapters')
  })

  test('7. Transparent pedagogical rationale banner with category chips', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Header & rationale banner
    assert.ok(content.includes('今日校长推荐') || content.includes('黄金研习组合'), 'Must include header title')
    assert.ok(content.includes('rationale'), 'Must bind recommendation.rationale')

    // Category labels mapping
    assert.ok(
      content.includes('魔法启程') &&
      content.includes('核心词汇强化') &&
      content.includes('进度承接') &&
      content.includes('进阶挑战'),
      'Must support 4 rationale category badges'
    )
  })

  test('8. Left Card (HP Chapter) and Right Card (TED Talk) rendering', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Left Card: HP Chapter
    assert.ok(content.includes('原著有声精读'), 'Must have "原著有声精读" tag')
    assert.ok(content.includes('recommendation.hpChapter.bookCode') || content.includes('hpChapter.bookCode'), 'Must render HP book code')
    assert.ok(content.includes('recommendation.hpChapter.titleZh') || content.includes('hpChapter.titleZh'), 'Must render HP chapter titleZh')
    assert.ok(content.includes('recommendation.hpChapter.title') || content.includes('hpChapter.title'), 'Must render HP chapter English title')
    assert.ok(content.includes('立即精听'), 'Must have "立即精听" primary CTA button')

    // Right Card: TED Talk
    assert.ok(content.includes('TED 思想拓展') || content.includes('TED思想拓展'), 'Must have "TED 思想拓展" tag')
    assert.ok(content.includes('recommendation.tedTalk.titleCn') || content.includes('tedTalk.titleCn'), 'Must render TED Chinese title')
    assert.ok(content.includes('recommendation.tedTalk.speaker') || content.includes('tedTalk.speaker'), 'Must render TED speaker')
    assert.ok(content.includes('开启 TED') || content.includes('开启TED'), 'Must have "开启 TED" primary CTA button')

    // CEFR badge color mapping (A2 emerald, B1 amber, B2 blue, C1 purple)
    assert.ok(content.includes('emerald'), 'Must support emerald styling for A2')
    assert.ok(content.includes('amber'), 'Must support amber styling for B1')
    assert.ok(content.includes('blue'), 'Must support blue styling for B2')
    assert.ok(content.includes('purple'), 'Must support purple styling for C1')
  })

  test('9. Direct routing and store dispatch on action buttons', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // HP CTA action
    assert.ok(content.includes('catalogStore.selectBook'), 'Must call catalogStore.selectBook')
    assert.ok(content.includes('catalogStore.selectChapter'), 'Must call catalogStore.selectChapter')
    assert.ok(content.includes("navigationStore.setView('player')"), "Must switch to 'player' view")
    assert.ok(content.includes("emit('open-chapter'"), "Must emit 'open-chapter'")

    // TED CTA action
    assert.ok(content.includes('selectTedTalk'), 'Must call selectTedTalk')
    assert.ok(content.includes("navigationStore.setView('ted')"), "Must switch to 'ted' view")
    assert.ok(content.includes("emit('open-ted'"), "Must emit 'open-ted'")
  })

  test('10. Lucide icons strictly imported without Unicode emojis', () => {
    assert.ok(fs.existsSync(filePath), 'RecommendationCard.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    assert.ok(content.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(content.includes('Sparkles'), 'Must import Sparkles icon')
    assert.ok(content.includes('BookOpen'), 'Must import BookOpen icon')
    assert.ok(content.includes('Video'), 'Must import Video icon')
    assert.ok(content.includes('Clock'), 'Must import Clock icon')
    assert.ok(content.includes('ChevronRight'), 'Must import ChevronRight icon')
    assert.ok(content.includes('Compass'), 'Must import Compass icon')
  })
})
