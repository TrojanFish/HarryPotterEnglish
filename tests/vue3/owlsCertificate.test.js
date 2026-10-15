import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'vue/compiler-sfc'
import { generateOwlsCertificateHTML } from '../../src/utils/owlsCertificateExport.js'

describe('O.W.L.s Printable Certificate Generator & Modal', () => {
  test('generateOwlsCertificateHTML produces valid parchment A4 HTML', () => {
    const examData = {
      id: 'owls-test-101',
      timestamp: Date.now(),
      cefrResult: 'B1',
      title: '魔法探索者',
      compositeScore: 88,
      dimensions: {
        auditory: 85,
        vocabDepth: 90,
        comprehension: 88,
        shadowing: 86,
        production: 91
      },
      mentorFeedback: '优秀的听辨与产出能力，已具备探究中级魔法文献的英语言语基础。'
    }

    const studentProfile = {
      name: 'Harry Potter',
      candidateId: 'OWL-1991-007'
    }

    const html = generateOwlsCertificateHTML(examData, studentProfile)

    assert.ok(typeof html === 'string', 'Return value must be an HTML string')
    
    // Ministry Header
    assert.ok(
      html.includes('Ministry of Magic') || html.includes('魔法部'),
      'Must include Ministry header'
    )
    assert.ok(
      html.includes('ORDINARY WIZARDING LEVEL') || html.includes('O.W.L.'),
      'Must reference Ordinary Wizarding Level'
    )

    // Student & CEFR details
    assert.ok(html.includes('B1'), 'Must display CEFR level')
    assert.ok(html.includes('魔法探索者'), 'Must display wizard title')
    assert.ok(html.includes('Harry Potter'), 'Must display student candidate name')
    assert.ok(html.includes('OWL-1991-007'), 'Must display candidate ID')

    // Embedded SVG 5-axis Radar Chart
    assert.ok(html.includes('<svg'), 'Must embed an SVG radar chart')
    assert.ok(html.includes('<polygon'), 'Must embed radar polygon')
    assert.ok(html.includes('听音推断') || html.includes('Auditory'), 'Radar must feature Auditory axis')

    // Subject Breakdown Table & Grades
    assert.ok(html.includes('听音推断与细节') || html.includes('Listening Comprehension'), 'Table must have listening subject')
    assert.ok(html.includes('核心词汇拼写产出') || html.includes('Production Spelling'), 'Table must have spelling subject')
    assert.ok(html.includes('名篇跟读语音流利') || html.includes('Oral Shadowing'), 'Table must have shadowing subject')
    assert.ok(html.includes('语境理解与综合推理') || html.includes('Contextual Reasoning'), 'Table must have reasoning subject')
    assert.ok(
      html.includes('Outstanding (O) 卓越') || html.includes('Exceeds Expectations (E) 良好'),
      'Must contain O.W.L. grade notations'
    )

    // Official Seal and Mentor Diagnostic
    assert.ok(
      html.includes('OFFICIAL SEAL') || html.includes('MINISTRY OF MAGIC EXAM BOARD'),
      'Must include official Ministry seal'
    )
    assert.ok(
      html.includes('优秀的听辨与产出能力'),
      'Must include personalized mentor feedback'
    )

    // Print media stylesheet and Single-page A4 containment
    assert.ok(html.includes('@media print'), 'Must include print media stylesheet')
    assert.ok(html.includes('size: A4 portrait') || html.includes('size: A4'), 'Must configure A4 portrait print size')
    assert.ok(html.includes('margin: 0'), 'Must reset print margins')

    // Zero Unicode Emojis
    assert.strictEqual(
      /\p{Extended_Pictographic}/gu.test(html),
      false,
      'Certificate must contain zero Unicode emojis'
    )
  })

  test('generateOwlsCertificateHTML handles empty or default values gracefully', () => {
    const html = generateOwlsCertificateHTML()
    assert.ok(typeof html === 'string')
    assert.ok(html.includes('Ministry of Magic') || html.includes('魔法部'))
    assert.ok(html.includes('A2') || html.includes('B1'))
    assert.strictEqual(/\p{Extended_Pictographic}/gu.test(html), false)
  })

  test('OwlsCertificateModal.vue exists and meets standards', () => {
    const modalPath = path.resolve('src/components/assessment/OwlsCertificateModal.vue')
    assert.ok(fs.existsSync(modalPath), 'OwlsCertificateModal.vue must exist')
    const content = fs.readFileSync(modalPath, 'utf-8')

    // Valid SFC parse
    const { descriptor, errors } = parse(content)
    assert.strictEqual(errors.length, 0, 'SFC parsing must have 0 errors')
    assert.ok(descriptor.template, 'Component must have a template block')
    assert.ok(descriptor.scriptSetup, 'Component must use <script setup>')

    // Print action and HTML generator integration
    assert.ok(
      content.includes('generateOwlsCertificateHTML') || content.includes('print'),
      'Must support printing or HTML generation'
    )

    // Props and Emits
    assert.ok(content.includes('isOpen'), 'Must accept isOpen prop')
    assert.ok(content.includes('examRecord'), 'Must accept examRecord prop')
    assert.ok(content.includes('close'), 'Must declare close emit')

    // Store integration (fallback to latest examHistory)
    assert.ok(content.includes('useAnalyticsStore'), 'Must bind to useAnalyticsStore')

    // Empty state CTA
    assert.ok(
      content.includes('前往开启评定考核') || content.includes('开启评定'),
      'Must display empty state CTA when no exam records exist'
    )

    // Design system: Touch targets & zero emojis
    assert.ok(content.includes('min-h-[44px]'), 'Must enforce Apple HIG min-h-[44px]')
    assert.ok(content.includes('min-w-[44px]'), 'Must enforce Apple HIG min-w-[44px]')
    assert.ok(content.includes('touch-manipulation'), 'Must include touch-manipulation')
    assert.strictEqual(
      content.match(/\p{Extended_Pictographic}/gu),
      null,
      'OwlsCertificateModal must contain zero Unicode emojis'
    )

    // Lucide icons
    assert.ok(content.includes('lucide-vue-next'), 'Must import icons from lucide-vue-next')
    assert.ok(!content.includes('lucide-react'), 'Must not import from lucide-react')

    // Dynamic candidate name
    assert.ok(content.includes('activeRecord.value?.candidateName'), 'Must resolve candidate name dynamically from record')
  })

  test('owlsCertificateExport.js uses valid CSS min-width property', () => {
    const exportPath = path.resolve('src/utils/owlsCertificateExport.js')
    const exportContent = fs.readFileSync(exportPath, 'utf-8')
    assert.ok(exportContent.includes('min-width: 44px;'), 'Must use standard CSS min-width property')
    assert.ok(!exportContent.includes('min-w: 44px;'), 'Must not contain invalid CSS min-w property')
  })
})
