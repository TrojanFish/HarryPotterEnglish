import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('K12 Typography & Touch Target Audit Pass', () => {
  const stepListeningSrc = fs.readFileSync(path.resolve('src/components/session/StepListening.vue'), 'utf8')
  const stepDictationSrc = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf8')
  const smartAudioPlayerSrc = fs.readFileSync(path.resolve('src/components/player/SmartAudioPlayer.vue'), 'utf8')

  describe('StepListening.vue typography floor', () => {
    it('English subtitle uses text-lg or larger (e.g. text-lg sm:text-xl)', () => {
      assert.ok(
        stepListeningSrc.includes('text-lg sm:text-xl') || stepListeningSrc.includes('text-xl'),
        'English subtitle text must be text-lg or larger for adolescent readability'
      )
    })

    it('Chinese translation uses text-sm sm:text-base (K12 readability floor)', () => {
      // Must not use text-xs as primary font size on mobile for translation
      assert.ok(
        stepListeningSrc.includes('text-sm sm:text-base'),
        'Chinese translation text must use text-sm sm:text-base (minimum 14px floor)'
      )
    })

    it('Interactive word tokens and controls maintain 44px touch targets', () => {
      assert.ok(
        stepListeningSrc.includes('min-h-[44px]'),
        'StepListening must enforce 44px minimum touch targets on control buttons'
      )
    })
  })

  describe('StepDictation.vue input floor & iOS attributes', () => {
    it('all <input> elements have text-base minimum to prevent iOS Safari auto-zoom', () => {
      // Extract all <input ...> tags
      const inputTags = stepDictationSrc.match(/<input[^>]*>/g) || []
      assert.ok(inputTags.length > 0, 'StepDictation must contain at least one <input> element')
      for (const tag of inputTags) {
        assert.ok(
          tag.includes('text-base') || tag.includes('text-lg'),
          `<input> must declare text-base (16px minimum): ${tag}`
        )
      }
    })

    it('<input> elements declare autoCapitalize="none" autoCorrect="off" spellCheck="false"', () => {
      const inputTags = stepDictationSrc.match(/<input[^>]*>/g) || []
      assert.ok(inputTags.length > 0, 'StepDictation must contain at least one <input> element')
      for (const tag of inputTags) {
        assert.ok(
          tag.includes('autoCapitalize="none"'),
          `<input> must declare autoCapitalize="none": ${tag}`
        )
        assert.ok(
          tag.includes('autoCorrect="off"'),
          `<input> must declare autoCorrect="off": ${tag}`
        )
        assert.ok(
          tag.includes('spellCheck="false"'),
          `<input> must declare spellCheck="false": ${tag}`
        )
      }
    })

    it('<input> elements declare min-h-[44px] touch target', () => {
      const inputTags = stepDictationSrc.match(/<input[^>]*>/g) || []
      for (const tag of inputTags) {
        assert.ok(
          tag.includes('min-h-[44px]') || tag.includes('h-11'),
          `<input> must have 44px touch target: ${tag}`
        )
      }
    })
  })

  describe('SmartAudioPlayer.vue 44px touch target compliance', () => {
    it('audio player buttons meet 44px touch target (min-h-[44px] or h-11/h-12)', () => {
      assert.ok(
        smartAudioPlayerSrc.includes('min-h-[44px]') || smartAudioPlayerSrc.includes('h-11') || smartAudioPlayerSrc.includes('h-12'),
        'SmartAudioPlayer buttons must meet 44px touch target'
      )
    })

    it('core play/pause CTA button declares min-h-[44px] or h-11', () => {
      assert.ok(
        smartAudioPlayerSrc.includes('w-11 h-11') || smartAudioPlayerSrc.includes('min-h-[44px]'),
        'Play/pause button must be at least 44x44px'
      )
    })

    it('auxiliary controls (loop, speed, seek, cue jump, sleep timer) have min-h-[44px]', () => {
      assert.ok(smartAudioPlayerSrc.includes('min-h-[44px]'), 'Auxiliary buttons must declare min-h-[44px]')
      assert.ok(smartAudioPlayerSrc.includes('min-w-[44px]'), 'Icon-only buttons must declare min-w-[44px]')
    })
  })
})
