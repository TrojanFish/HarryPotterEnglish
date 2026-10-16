import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const AUTH_TOKEN_KEY = 'hp_auth_token'
export const USER_AVATAR_KEY = 'hp_user_avatar'

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref(null)
  const token = ref(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(AUTH_TOKEN_KEY)
      : null
  )
  const localAvatar = ref(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(USER_AVATAR_KEY) || null
      : null
  )
  const isLoading = ref(false)

  // Getters / Computed
  const isLoggedIn = computed(() => !!currentUser.value)

  const isPro = computed(() => {
    if (!currentUser.value?.isPro) return false
    const exp = currentUser.value.proExpiresAt
    if (exp === null) return true
    return Date.now() < exp
  })

  const proLabel = computed(() => {
    if (!isLoggedIn.value) return null
    return isPro.value ? 'Pro' : '普通学员'
  })

  const displayName = computed(() => {
    if (!currentUser.value) return null
    return currentUser.value.wizardName || currentUser.value.username
  })

  const avatarId = computed(() => {
    return currentUser.value?.avatar || localAvatar.value || 'default'
  })

  // Internal request helper
  async function _request(method, path, body) {
    isLoading.value = true
    try {
      const headers = {
        'Content-Type': 'application/json'
      }

      if (token.value) {
        headers['Authorization'] = 'Bearer ' + token.value
      }

      const options = {
        method,
        headers
      }

      if (body !== undefined) {
        options.body = JSON.stringify(body)
      }

      const res = await fetch(`/api${path}`, options)
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const error = new Error(data.message || 'Request failed')
        error.code = data.error || 'REQUEST_FAILED'
        error.status = res.status
        throw error
      }

      return data
    } finally {
      isLoading.value = false
    }
  }

  // Actions
  async function register(username, password, wizardName) {
    const data = await _request('POST', '/auth/register', {
      username,
      password,
      wizardName
    })

    token.value = data.token
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      } catch {}
    }

    currentUser.value = {
      userId: data.userId,
      username: data.username,
      wizardName: data.wizardName,
      avatar: data.avatar,
      isPro: data.isPro,
      proExpiresAt: data.proExpiresAt
    }

    return data
  }

  async function login(username, password) {
    const data = await _request('POST', '/auth/login', {
      username,
      password
    })

    token.value = data.token
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      } catch {}
    }

    currentUser.value = {
      userId: data.userId,
      username: data.username,
      wizardName: data.wizardName,
      avatar: data.avatar,
      isPro: data.isPro,
      proExpiresAt: data.proExpiresAt
    }

    return data
  }

  function logout() {
    token.value = null
    currentUser.value = null
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      } catch {}
    }
  }

  async function refreshMe() {
    if (!token.value) return null
    try {
      const data = await _request('GET', '/auth/me')
      currentUser.value = {
        userId: data.userId,
        username: data.username,
        wizardName: data.wizardName,
        avatar: data.avatar,
        isPro: data.isPro,
        proExpiresAt: data.proExpiresAt
      }
      return currentUser.value
    } catch (err) {
      if (
        err.status === 401 ||
        err.code === 'INVALID_TOKEN' ||
        err.code === 'TOKEN_EXPIRED'
      ) {
        logout()
      }
      throw err
    }
  }

  async function redeemActivation(code) {
    const data = await _request('POST', '/activation/redeem', { code })
    if (currentUser.value) {
      currentUser.value.isPro = data.isPro
      currentUser.value.proExpiresAt = data.proExpiresAt
    }
    return data
  }

  async function setAvatar(avatarIdValue) {
    const cleanId = avatarIdValue || 'user'
    localAvatar.value = cleanId
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(USER_AVATAR_KEY, cleanId)
      } catch {}
    }

    if (isLoggedIn.value) {
      const data = await _request('PATCH', '/auth/me', { avatarId: cleanId })
      if (currentUser.value) {
        currentUser.value.avatar = data.avatar
      }
      return data
    }
    return { ok: true, avatar: cleanId }
  }

  async function init() {
    try {
      await refreshMe()
    } catch {}
  }

  return {
    currentUser,
    token,
    localAvatar,
    isLoading,
    isLoggedIn,
    isPro,
    proLabel,
    displayName,
    avatarId,
    _request,
    register,
    login,
    logout,
    refreshMe,
    redeemActivation,
    setAvatar,
    init
  }
})
