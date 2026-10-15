import { describe, test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Analytics Telemetry Instrumentation', () => {
  test('StepListening records listening time to analyticsStore', () => {
    const content = fs.readFileSync(path.resolve('src/components/session/StepListening.vue'), 'utf-8')
    assert.ok(content.includes('useAnalyticsStore'), 'StepListening must import useAnalyticsStore')
    assert.ok(content.includes('recordListeningTime'), 'StepListening must call recordListeningTime')
  })

  test('StepShadowing and TedShadowing record scores to analyticsStore', () => {
    const hp = fs.readFileSync(path.resolve('src/components/session/StepShadowing.vue'), 'utf-8')
    assert.ok(hp.includes('useAnalyticsStore') && hp.includes('recordShadowingScore'), 'StepShadowing must record shadowing score')

    const ted = fs.readFileSync(path.resolve('src/components/ted/TedShadowing.vue'), 'utf-8')
    assert.ok(ted.includes('useAnalyticsStore') && ted.includes('recordShadowingScore'), 'TedShadowing must record shadowing score')
  })

  test('StepDictation records dictation results to analyticsStore', () => {
    const dict = fs.readFileSync(path.resolve('src/components/session/StepDictation.vue'), 'utf-8')
    assert.ok(dict.includes('useAnalyticsStore') && dict.includes('recordDictationResult'), 'StepDictation must record dictation results')
  })
})
