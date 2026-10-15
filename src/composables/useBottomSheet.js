import { ref, computed } from 'vue'

/**
 * useBottomSheet
 * Provides iOS native Bottom Sheet gesture handling:
 * - 1:1 downward touch tracking
 * - Safe spring-back if drag < threshold
 * - Swipe-down-to-dismiss when drag >= threshold
 */
export function useBottomSheet(options = {}) {
  const {
    threshold = 80,
    onClose = () => {}
  } = options

  const sheetOffsetY = ref(0)
  const isDragging = ref(false)
  let startY = 0

  function onTouchStart(e) {
    if (!e || !e.touches || e.touches.length === 0) return
    startY = e.touches[0].clientY
    isDragging.value = true
  }

  function onTouchMove(e, currentScrollTop = 0) {
    if (!isDragging.value || !e || !e.touches || e.touches.length === 0) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    // Only allow downward drag when scroll position is at the very top
    if (deltaY > 0 && currentScrollTop <= 0) {
      sheetOffsetY.value = deltaY
      if (e.cancelable && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
    } else {
      sheetOffsetY.value = 0
    }
  }

  function onTouchEnd() {
    if (!isDragging.value) return
    isDragging.value = false

    if (sheetOffsetY.value >= threshold) {
      sheetOffsetY.value = 0
      onClose()
    } else {
      sheetOffsetY.value = 0
    }
  }

  function resetOffset() {
    sheetOffsetY.value = 0
    isDragging.value = false
  }

  const sheetStyle = computed(() => {
    if (sheetOffsetY.value > 0) {
      return {
        transform: `translateY(${sheetOffsetY.value}px)`,
        transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
    return {
      transform: 'translateY(0px)',
      transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }
  })

  return {
    sheetOffsetY,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetOffset,
    sheetStyle
  }
}
