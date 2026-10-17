import { reactive } from 'vue'

/**
 * useModalManager - Centralized manager for global modal and slide-over states.
 * Eliminates state bloat in AppShell and provides a predictable interface for modal visibility.
 */
export function useModalManager() {
  const modals = reactive({
    vocab: false,
    analytics: false,
    storage: false,
    shortcuts: false,
    badges: false,
    sorting: false,
    cloudSync: false,
    auth: false,
    settings: false
  })

  function open(name) {
    if (name in modals) {
      modals[name] = true
    }
  }

  function close(name) {
    if (name in modals) {
      modals[name] = false
    }
  }

  function toggle(name) {
    if (name in modals) {
      modals[name] = !modals[name]
    }
  }

  function closeAll() {
    Object.keys(modals).forEach((key) => {
      modals[key] = false
    })
  }

  return {
    modals,
    open,
    close,
    toggle,
    closeAll
  }
}
