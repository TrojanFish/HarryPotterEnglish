import { defineStore } from 'pinia'

export const VALID_VIEWS = ['bookshelf', 'player', 'ted', 'vocab', 'analytics', 'storage', 'assessment', 'badges']
export const COLLAPSED_KEY = 'hp_sidebar_collapsed'

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    currentView: 'bookshelf',
    isCollapsed: (() => {
      try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(COLLAPSED_KEY) === 'true'
      } catch {
        return false
      }
    })()
  }),
  actions: {
    setView(view) {
      if (VALID_VIEWS.includes(view)) {
        this.currentView = view
      }
    },
    setCurrentView(view) {
      this.setView(view)
    },
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(COLLAPSED_KEY, String(this.isCollapsed))
        }
      } catch {}
    }
  }
})
