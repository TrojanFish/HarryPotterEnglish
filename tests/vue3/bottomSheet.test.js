import test from 'node:test'
import assert from 'node:assert'
import { useBottomSheet } from '../../src/composables/useBottomSheet.js'

test('useBottomSheet initializes with zero offset and not dragging', () => {
  const { sheetOffsetY, isDragging, sheetStyle } = useBottomSheet()
  assert.strictEqual(sheetOffsetY.value, 0)
  assert.strictEqual(isDragging.value, false)
  assert.ok(sheetStyle.value.transform.includes('translateY(0px)'))
})

test('onTouchMove updates sheetOffsetY when dragging downwards at scroll top', () => {
  const { sheetOffsetY, isDragging, onTouchStart, onTouchMove } = useBottomSheet()

  onTouchStart({ touches: [{ clientY: 100 }] })
  assert.strictEqual(isDragging.value, true)

  onTouchMove({ touches: [{ clientY: 160 }], cancelable: false }, 0)
  assert.strictEqual(sheetOffsetY.value, 60)

  // Dragging upwards shouldn't produce negative offset
  onTouchMove({ touches: [{ clientY: 80 }], cancelable: false }, 0)
  assert.strictEqual(sheetOffsetY.value, 0)
})

test('onTouchEnd triggers onClose when dragging exceeds threshold', () => {
  let closed = false
  const { onTouchStart, onTouchMove, onTouchEnd } = useBottomSheet({
    threshold: 80,
    onClose: () => {
      closed = true
    }
  })

  onTouchStart({ touches: [{ clientY: 100 }] })
  onTouchMove({ touches: [{ clientY: 200 }], cancelable: false }, 0) // delta = 100 > 80
  onTouchEnd()

  assert.strictEqual(closed, true)
})

test('onTouchEnd springs back without closing when delta is below threshold', () => {
  let closed = false
  const { sheetOffsetY, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheet({
    threshold: 80,
    onClose: () => {
      closed = true
    }
  })

  onTouchStart({ touches: [{ clientY: 100 }] })
  onTouchMove({ touches: [{ clientY: 140 }], cancelable: false }, 0) // delta = 40 < 80
  onTouchEnd()

  assert.strictEqual(closed, false)
  assert.strictEqual(sheetOffsetY.value, 0)
})
