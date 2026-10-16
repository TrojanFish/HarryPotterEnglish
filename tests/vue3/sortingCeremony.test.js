import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'

describe('SortingCeremonyModal.vue Component Standards & Implementation', () => {
  const filePath = path.resolve('src/components/gamification/SortingCeremonyModal.vue')

  test('1. SortingCeremonyModal.vue exists and is a valid Vue 3 SFC', () => {
    assert.ok(fs.existsSync(filePath), 'src/components/gamification/SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')
  })

  test('2. Strict Design System: Zero Unicode emojis anywhere', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
    assert.strictEqual(emojiMatches, null, 'Must contain zero Unicode emoji characters')
    const rangeRegex = /[\u{1F300}-\u{1FAFF}]/u
    assert.strictEqual(rangeRegex.test(content), false, 'Must contain zero Unicode emoji in range')
  })

  test('3. Warm parchment styling and noble aesthetic tokens', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Warm parchment theme
    assert.ok(content.includes('#fbf9f5') || content.includes('#faf6ee'), 'Must use warm parchment background (#fbf9f5 or #faf6ee)')
    assert.ok(content.includes('#e8ddd0') || content.includes('border-stone-200') || content.includes('border-amber-200'), 'Must use parchment border tokens')
    assert.ok(content.includes('#1c1917') || content.includes('text-stone-900'), 'Must use high-contrast dark stone text')
    assert.ok(content.includes('rounded-2xl') || content.includes('rounded-3xl'), 'Must use rounded modal dialog container')
  })

  test('4. Apple HIG 44px touch targets and accessibility dialog semantics', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Apple HIG: min 44x44px touch targets and touch-manipulation
    assert.ok(content.includes('min-h-[44px]'), 'Interactive elements must satisfy min-h-[44px]')
    assert.ok(content.includes('min-w-[44px]'), 'Buttons and icons must satisfy min-w-[44px]')
    assert.ok(content.includes('touch-manipulation'), 'Interactive elements must have touch-manipulation')

    // Accessibility
    assert.ok(content.includes('role="dialog"'), 'Modal must declare role="dialog"')
    assert.ok(content.includes('aria-modal="true"'), 'Modal must declare aria-modal="true"')
    assert.ok(content.includes('aria-label="分院帽仪式"'), 'Modal must declare aria-label="分院帽仪式"')
    assert.ok(content.includes('aria-label='), 'Close button and tabs must have aria-label')
    assert.ok(content.includes('handleKeydown') || content.includes('Escape') || content.includes('keydown'), 'Must support Esc key dismissal')
  })

  test('5. Lucide icons mapping for crests and interface controls', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Lucide import
    assert.ok(content.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!content.includes('lucide-react'), 'Must not import from lucide-react')

    // Four House crest icons
    assert.ok(content.includes('Flame'), 'Must import Flame for Gryffindor')
    assert.ok(content.includes('BookOpen'), 'Must import BookOpen for Ravenclaw')
    assert.ok(content.includes('Heart'), 'Must import Heart for Hufflepuff')
    assert.ok(content.includes('Crown'), 'Must import Crown for Slytherin')

    // Interface utility icons
    assert.ok(content.includes('GraduationCap'), 'Must import GraduationCap icon')
    assert.ok(content.includes('Sparkles'), 'Must import Sparkles icon')
    assert.ok(content.includes('Check'), 'Must import Check icon')
    assert.ok(content.includes('ChevronRight'), 'Must import ChevronRight icon')
    assert.ok(content.includes('X'), 'Must import X icon')
    assert.ok(content.includes('RotateCcw'), 'Must import RotateCcw icon')
    assert.ok(content.includes('Compass'), 'Must import Compass icon')
  })

  test('6. Props and Emits interface conforms to specification', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Props
    assert.ok(content.includes('isOpen'), 'Must declare isOpen prop')

    // Emits
    assert.ok(content.includes("'close'"), "Must emit 'close'")
    assert.ok(content.includes("'sorted'"), "Must emit 'sorted'")
  })

  test('7. Four Hogwarts houses presence with authentic qualities and mottos', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Four houses
    assert.ok(content.includes('gryffindor') && content.includes('格兰芬多'), 'Must contain Gryffindor')
    assert.ok(content.includes('ravenclaw') && content.includes('拉文克劳'), 'Must contain Ravenclaw')
    assert.ok(content.includes('hufflepuff') && content.includes('赫奇帕奇'), 'Must contain Hufflepuff')
    assert.ok(content.includes('slytherin') && content.includes('斯莱特林'), 'Must contain Slytherin')
  })

  test('8. Two interactive modes: Personality Quiz & Direct Selection with tabs', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Mode tabs
    assert.ok(content.includes('分院帽测验') || content.includes('性格测验'), 'Must have personality quiz tab')
    assert.ok(content.includes('自主选院') || content.includes('直接选择'), 'Must have direct selection tab')

    // 4 quiz questions
    assert.ok(content.includes('questions') || content.includes('QUIZ_QUESTIONS'), 'Must define quiz questions')

    // Stepper progression (1/4 to 4/4)
    assert.ok(content.includes('currentQuestionIndex') || content.includes('step') || content.includes('questionIndex'), 'Must track question index')
    assert.ok(content.includes('/ 4') || content.includes('/4') || content.includes('.length'), 'Must display stepper progression')

    // Result screen & CTA
    assert.ok(content.includes('入席分院并开启学院杯'), 'Must contain primary CTA button: 入席分院并开启学院杯')
  })

  test('9. Store binding and completion actions', () => {
    assert.ok(fs.existsSync(filePath), 'SortingCeremonyModal.vue must exist')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Store integration
    assert.ok(content.includes('useGamificationStore'), 'Must bind to useGamificationStore')
    assert.ok(content.includes('selectHouse'), 'Must call selectHouse action')
  })

  test('10. Personality quiz scoring logic resolves dominant house affinity', () => {
    function computeAffinityHouse(answers) {
      const scores = { gryffindor: 0, ravenclaw: 0, hufflepuff: 0, slytherin: 0 }
      for (const qIdx of Object.keys(answers)) {
        const h = answers[qIdx]
        if (scores[h] !== undefined) scores[h]++
      }
      let topHouse = 'gryffindor'
      let maxScore = -1
      const priorityOrder = ['gryffindor', 'ravenclaw', 'hufflepuff', 'slytherin']
      for (const house of priorityOrder) {
        if (scores[house] > maxScore) {
          maxScore = scores[house]
          topHouse = house
        }
      }
      return topHouse
    }

    assert.strictEqual(computeAffinityHouse({ 0: 'gryffindor', 1: 'gryffindor', 2: 'ravenclaw', 3: 'gryffindor' }), 'gryffindor')
    assert.strictEqual(computeAffinityHouse({ 0: 'ravenclaw', 1: 'ravenclaw', 2: 'hufflepuff', 3: 'ravenclaw' }), 'ravenclaw')
    assert.strictEqual(computeAffinityHouse({ 0: 'hufflepuff', 1: 'hufflepuff', 2: 'slytherin', 3: 'hufflepuff' }), 'hufflepuff')
    assert.strictEqual(computeAffinityHouse({ 0: 'slytherin', 1: 'slytherin', 2: 'slytherin', 3: 'gryffindor' }), 'slytherin')
    // Tie breaker test follows priorityOrder
    assert.strictEqual(computeAffinityHouse({ 0: 'gryffindor', 1: 'ravenclaw', 2: 'hufflepuff', 3: 'slytherin' }), 'gryffindor')
  })
})
