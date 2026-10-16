import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const TARGET_FILES = [
  'src/components/session/StepListening.vue',
  'src/components/session/StepShadowing.vue',
  'src/components/session/StepDictation.vue',
  'src/components/session/StepVocabReview.vue',
  'src/components/layout/StepTabBar.vue',
  'src/components/player/SmartAudioPlayer.vue',
  'src/components/BookshelfDrawer.vue',
  'src/components/VocabularyDrawer.vue',
  'src/components/ted/TedVocabPreload.vue',
  'src/components/ted/TedTaskStudio.vue',
  'src/components/ted/TedShadowing.vue',
  'src/components/ted/TedTalkList.vue',
  'src/components/ted/TedStepBar.vue'
]

function readComponent(relPath) {
  const fullPath = path.resolve(relPath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Design System Unification to AssessmentHub Benchmark', () => {

  describe('1. Target File Verification', () => {
    test('all 13 core components exist and are non-empty', () => {
      for (const relPath of TARGET_FILES) {
        const fullPath = path.resolve(relPath)
        assert.ok(fs.existsSync(fullPath), `Target file does not exist: ${relPath}`)
        const stats = fs.statSync(fullPath)
        assert.ok(stats.size > 0, `Target file is empty: ${relPath}`)
      }
    })
  })

  describe('2. Zero Unicode Emojis', () => {
    test('none of the 13 files contain Unicode Emojis', () => {
      for (const relPath of TARGET_FILES) {
        const content = readComponent(relPath)
        const emojiMatches = content.match(/\p{Extended_Pictographic}/gu)
        assert.strictEqual(
          emojiMatches,
          null,
          `${relPath} must contain zero Unicode emojis, found: ${emojiMatches ? emojiMatches.join(', ') : ''}`
        )
      }
    })
  })

  describe('3. Apple HIG Touch Target Standards', () => {
    test('all core components enforce min-h-[44px] touch target floor', () => {
      for (const relPath of TARGET_FILES) {
        const content = readComponent(relPath)
        assert.ok(
          content.includes('min-h-[44px]'),
          `${relPath} must declare min-h-[44px] for Apple HIG compliance`
        )
      }
    })

    test('all core components declare touch-manipulation for mobile responsiveness', () => {
      for (const relPath of TARGET_FILES) {
        const content = readComponent(relPath)
        assert.ok(
          content.includes('touch-manipulation'),
          `${relPath} must declare touch-manipulation for touch ergonomics`
        )
      }
    })
  })

  describe('4. StepListening design compliance', () => {
    test('StepListening eliminates legacy tech blue (#2563eb) and cold zinc gray (#e4e4e7)', () => {
      const content = readComponent('src/components/session/StepListening.vue')
      assert.ok(!content.includes('#2563eb'), 'StepListening must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'StepListening must not contain cold zinc border #e4e4e7')
    })

    test('StepListening implements warm parchment canvas and border tokens', () => {
      const content = readComponent('src/components/session/StepListening.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StepListening container must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StepListening must declare border-[#e8ddd0]')
    })

    test('StepListening implements amber active cue highlight and timestamp accent', () => {
      const content = readComponent('src/components/session/StepListening.vue')
      assert.ok(
        content.includes('border-l-amber-600'),
        'StepListening active cue card must declare border-l-amber-600'
      )
      assert.ok(
        content.includes('text-amber-800'),
        'StepListening active cue timestamp must declare text-amber-800'
      )
      assert.ok(
        content.includes('bg-[#f5efe6]'),
        'StepListening right-side core vocab panel must declare bg-[#f5efe6]'
      )
    })
  })

  describe('5. StepShadowing design compliance', () => {
    test('StepShadowing eliminates legacy tech blue (#2563eb) and cold zinc gray (#e4e4e7)', () => {
      const content = readComponent('src/components/session/StepShadowing.vue')
      assert.ok(!content.includes('#2563eb'), 'StepShadowing must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'StepShadowing must not contain cold zinc border #e4e4e7')
    })

    test('StepShadowing implements warm parchment canvas and hero card surface', () => {
      const content = readComponent('src/components/session/StepShadowing.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StepShadowing container must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StepShadowing must declare border-[#e8ddd0]')
      assert.ok(content.includes('bg-[#f5efe6]'), 'StepShadowing target sentence card must declare bg-[#f5efe6]')
    })

    test('StepShadowing implements amber recording CTA and accent icons', () => {
      const content = readComponent('src/components/session/StepShadowing.vue')
      assert.ok(
        content.includes('bg-amber-700'),
        'StepShadowing record primary CTA button must declare bg-amber-700'
      )
      assert.ok(
        content.includes('text-amber-700'),
        'StepShadowing mic or audio track icons must declare text-amber-700'
      )
    })
  })

  describe('6. StepDictation design compliance', () => {
    test('StepDictation eliminates legacy tech blue (#2563eb) and cold zinc gray (#e4e4e7)', () => {
      const content = readComponent('src/components/session/StepDictation.vue')
      assert.ok(!content.includes('#2563eb'), 'StepDictation must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'StepDictation must not contain cold zinc border #e4e4e7')
    })

    test('StepDictation implements warm parchment canvas and border tokens', () => {
      const content = readComponent('src/components/session/StepDictation.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StepDictation container must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StepDictation must declare border-[#e8ddd0]')
    })

    test('StepDictation implements amber game mode, focus rings, and submit CTA', () => {
      const content = readComponent('src/components/session/StepDictation.vue')
      assert.ok(
        content.includes('bg-amber-700'),
        'StepDictation active mode and submit button must declare bg-amber-700'
      )
      assert.ok(
        content.includes('focus:border-amber-600'),
        'StepDictation input focus must declare focus:border-amber-600'
      )
      assert.ok(
        content.includes('bg-amber-100'),
        'StepDictation streak badge must declare bg-amber-100'
      )
    })
  })

  describe('7. StepVocabReview design compliance', () => {
    test('StepVocabReview eliminates legacy tech blue (#2563eb) and cold zinc gray (#e4e4e7)', () => {
      const content = readComponent('src/components/session/StepVocabReview.vue')
      assert.ok(!content.includes('#2563eb'), 'StepVocabReview must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'StepVocabReview must not contain cold zinc border #e4e4e7')
    })

    test('StepVocabReview implements warm parchment canvas and 5-box container', () => {
      const content = readComponent('src/components/session/StepVocabReview.vue')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StepVocabReview container must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StepVocabReview must declare border-[#e8ddd0]')
      assert.ok(content.includes('bg-[#f5efe6]'), 'StepVocabReview 5-box switcher card must declare bg-[#f5efe6]')
    })

    test('StepVocabReview implements amber active box pill', () => {
      const content = readComponent('src/components/session/StepVocabReview.vue')
      assert.ok(
        content.includes('bg-amber-700'),
        'StepVocabReview active box pill must declare bg-amber-700'
      )
    })
  })

  describe('8. StepTabBar and SmartAudioPlayer design compliance', () => {
    test('StepTabBar eliminates #2563eb and #e4e4e7 and adopts amber active step', () => {
      const content = readComponent('src/components/layout/StepTabBar.vue')
      assert.ok(!content.includes('#2563eb'), 'StepTabBar must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'StepTabBar must not contain cold zinc border #e4e4e7')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'StepTabBar must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'StepTabBar must declare border-[#e8ddd0]')
      assert.ok(content.includes('bg-amber-700'), 'StepTabBar active step button must declare bg-amber-700')
    })

    test('SmartAudioPlayer eliminates #2563eb and #e4e4e7 and adopts parchment and amber accents', () => {
      const content = readComponent('src/components/player/SmartAudioPlayer.vue')
      assert.ok(!content.includes('#2563eb'), 'SmartAudioPlayer must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'SmartAudioPlayer must not contain cold zinc border #e4e4e7')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'SmartAudioPlayer must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'SmartAudioPlayer must declare border-[#e8ddd0]')
      assert.ok(
        content.includes('bg-amber-600') || content.includes('bg-amber-700'),
        'SmartAudioPlayer progress fill and play button must use amber accents'
      )
    })
  })

  describe('9. BookshelfDrawer and VocabularyDrawer design compliance', () => {
    test('BookshelfDrawer eliminates #2563eb and #e4e4e7 and adopts parchment and amber active tab', () => {
      const content = readComponent('src/components/BookshelfDrawer.vue')
      assert.ok(!content.includes('#2563eb'), 'BookshelfDrawer must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'BookshelfDrawer must not contain cold zinc border #e4e4e7')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'BookshelfDrawer panel must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'BookshelfDrawer must declare border-[#e8ddd0]')
      assert.ok(
        content.includes('border-amber-600'),
        'BookshelfDrawer active book tab must declare border-amber-600'
      )
    })

    test('VocabularyDrawer eliminates #2563eb and #e4e4e7 and adopts parchment and amber filter', () => {
      const content = readComponent('src/components/VocabularyDrawer.vue')
      assert.ok(!content.includes('#2563eb'), 'VocabularyDrawer must not contain tech blue #2563eb')
      assert.ok(!content.includes('#e4e4e7'), 'VocabularyDrawer must not contain cold zinc border #e4e4e7')
      assert.ok(content.includes('bg-[#fbf9f5]'), 'VocabularyDrawer panel must declare bg-[#fbf9f5]')
      assert.ok(content.includes('border-[#e8ddd0]'), 'VocabularyDrawer must declare border-[#e8ddd0]')
      assert.ok(
        content.includes('bg-amber-700'),
        'VocabularyDrawer active box filter button must declare bg-amber-700'
      )
    })
  })

  describe('10. TED ecosystem design compliance', () => {
    const tedFiles = [
      'src/components/ted/TedVocabPreload.vue',
      'src/components/ted/TedTaskStudio.vue',
      'src/components/ted/TedShadowing.vue',
      'src/components/ted/TedTalkList.vue',
      'src/components/ted/TedStepBar.vue'
    ]

    test('TED components eliminate tech blue (#2563eb) and cold zinc gray (#e4e4e7)', () => {
      for (const relPath of tedFiles) {
        const content = readComponent(relPath)
        assert.ok(!content.includes('#2563eb'), `${relPath} must not contain tech blue #2563eb`)
        assert.ok(!content.includes('#e4e4e7'), `${relPath} must not contain cold zinc border #e4e4e7`)
      }
    })

    test('TED components adopt warm parchment canvas and border tokens', () => {
      for (const relPath of tedFiles) {
        const content = readComponent(relPath)
        assert.ok(content.includes('bg-[#fbf9f5]'), `${relPath} must declare bg-[#fbf9f5]`)
        assert.ok(content.includes('border-[#e8ddd0]'), `${relPath} must declare border-[#e8ddd0]`)
      }
    })

    test('TED components use amber accent tokens across active actions', () => {
      const tedShadowing = readComponent('src/components/ted/TedShadowing.vue')
      assert.ok(
        tedShadowing.includes('bg-amber-700'),
        'TedShadowing must declare bg-amber-700 for recording action'
      )

      const tedStepBar = readComponent('src/components/ted/TedStepBar.vue')
      assert.ok(
        tedStepBar.includes('bg-amber-700'),
        'TedStepBar must declare bg-amber-700 for active step'
      )
    })
  })
})
