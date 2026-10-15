import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue'

/**
 * useBreakpointVue — Responsive multi-device breakpoint detector for Vue 3
 * Standard Tailwind breakpoints:
 * - Mobile:  < 768px (iPhone / Android smartphones)
 * - Tablet:  >= 768px && < 1024px (iPad / Android tablets)
 * - Desktop: >= 1024px (Laptops, PC monitors, wide displays)
 */
export function useBreakpointVue() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
  let timer = null

  function onResize() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        windowWidth.value = window.innerWidth
      }
    }, 60)
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', onResize)
      }
    })

    onUnmounted(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize)
      }
      clearTimeout(timer)
    })
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', onResize)
  }

  const isMobile = () => windowWidth.value < 768
  Object.defineProperty(isMobile, 'value', {
    get: () => windowWidth.value < 768
  })

  const isTablet = () => windowWidth.value >= 768 && windowWidth.value < 1024
  Object.defineProperty(isTablet, 'value', {
    get: () => windowWidth.value >= 768 && windowWidth.value < 1024
  })

  const isDesktop = () => windowWidth.value >= 1024
  Object.defineProperty(isDesktop, 'value', {
    get: () => windowWidth.value >= 1024
  })

  const device = () => (isMobile() ? 'mobile' : isTablet() ? 'tablet' : 'desktop')
  Object.defineProperty(device, 'value', {
    get: () => (isMobile() ? 'mobile' : isTablet() ? 'tablet' : 'desktop')
  })

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    device
  }
}

export default useBreakpointVue
