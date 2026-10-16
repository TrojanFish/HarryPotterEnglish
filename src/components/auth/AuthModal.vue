<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="巫师身份认证"
      @click.self="handleClose"
    >
      <div
        class="bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl max-w-sm w-full p-6 relative select-none shadow-none text-stone-800"
        @click.stop
      >
        <!-- Close button at top right -->
        <button
          type="button"
          class="absolute top-4 right-4 w-9 h-9 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-colors"
          aria-label="关闭认证弹窗"
          @click="handleClose"
        >
          <X :size="20" class="w-5 h-5" />
        </button>

        <!-- Brand / Header Icon -->
        <div class="flex items-center gap-2 mb-4">
          <div class="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-300/60 flex items-center justify-center text-amber-800">
            <Sparkles :size="18" class="w-4.5 h-4.5 text-amber-700" />
          </div>
          <div>
            <h2 class="text-base font-bold text-stone-900 tracking-tight">霍格沃茨学籍档案</h2>
            <p class="text-[11px] text-stone-500">登录或注册巫师账号以同步研学进度</p>
          </div>
        </div>

        <!-- Tab Switcher (登录 / 注册) -->
        <div class="flex border-b border-[#e8ddd0] mb-5">
          <button
            type="button"
            class="flex-1 pb-2.5 text-center text-sm font-semibold transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 flex items-center justify-center"
            :class="activeTab === 'login' ? 'border-b-2 border-amber-700 text-amber-900 font-bold -mb-px' : 'text-stone-500 hover:text-stone-800 border-b-2 border-transparent'"
            @click="switchTab('login')"
          >
            <span>登录</span>
          </button>
          <button
            type="button"
            class="flex-1 pb-2.5 text-center text-sm font-semibold transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 flex items-center justify-center"
            :class="activeTab === 'register' ? 'border-b-2 border-amber-700 text-amber-900 font-bold -mb-px' : 'text-stone-500 hover:text-stone-800 border-b-2 border-transparent'"
            @click="switchTab('register')"
          >
            <span>注册</span>
          </button>
        </div>

        <!-- Error display -->
        <div
          v-if="errorMsg"
          class="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2"
        >
          <AlertCircle :size="16" class="w-4 h-4 shrink-0 text-rose-600" />
          <p class="text-rose-700 text-xs font-medium mt-1 leading-snug">{{ errorMsg }}</p>
        </div>

        <!-- Login Form -->
        <form
          v-if="activeTab === 'login'"
          class="space-y-3.5"
          @submit.prevent="handleLogin"
        >
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">巫师学号 / 用户名</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-stone-400 pointer-events-none">
                <User :size="16" class="w-4 h-4" />
              </span>
              <input
                v-model="loginUsername"
                type="text"
                autocomplete="username"
                placeholder="巫师学号 / 用户名"
                required
                class="w-full h-11 min-h-[44px] pl-9 pr-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">通行密码</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-stone-400 pointer-events-none">
                <Lock :size="16" class="w-4 h-4" />
              </span>
              <input
                v-model="loginPassword"
                type="password"
                autocomplete="current-password"
                placeholder="通行密码"
                required
                class="w-full h-11 min-h-[44px] pl-9 pr-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full h-11 min-h-[44px] min-w-[44px] rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-50 font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Loader2 v-if="authStore.isLoading" :size="16" class="w-4 h-4 animate-spin text-amber-50" />
            <span>{{ authStore.isLoading ? '正在验证學籍...' : '登入魔法学籍' }}</span>
          </button>
        </form>

        <!-- Register Form -->
        <form
          v-else
          class="space-y-3"
          @submit.prevent="handleRegister"
        >
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">学籍用户名</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-stone-400 pointer-events-none">
                <User :size="16" class="w-4 h-4" />
              </span>
              <input
                v-model="regUsername"
                type="text"
                autocomplete="username"
                placeholder="设置用户名 (3-20位字母/数字/下划线)"
                required
                class="w-full h-11 min-h-[44px] pl-9 pr-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
              />
            </div>
            <p class="text-[11px] text-stone-500">3–20 位字母、数字或下划线</p>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">魔法姓名 (选填)</label>
            <input
              v-model="regWizardName"
              type="text"
              autocomplete="nickname"
              placeholder="魔法姓名 / 昵称 (如: 哈利)"
              class="w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">设置密码</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-stone-400 pointer-events-none">
                <Lock :size="16" class="w-4 h-4" />
              </span>
              <input
                v-model="regPassword"
                type="password"
                autocomplete="new-password"
                placeholder="设置密码 (至少6位)"
                required
                class="w-full h-11 min-h-[44px] pl-9 pr-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-stone-700">确认密码</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-stone-400 pointer-events-none">
                <Shield :size="16" class="w-4 h-4" />
              </span>
              <input
                v-model="regConfirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="确认密码"
                required
                class="w-full h-11 min-h-[44px] pl-9 pr-3.5 rounded-xl border border-[#e8ddd0] bg-[#f5efe6]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-sm text-stone-900 placeholder:text-stone-400 touch-manipulation transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full h-11 min-h-[44px] min-w-[44px] rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-50 font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Loader2 v-if="authStore.isLoading" :size="16" class="w-4 h-4 animate-spin text-amber-50" />
            <span>{{ authStore.isLoading ? '正在注册学籍...' : '注册魔法学籍' }}</span>
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { X, Sparkles, User, Lock, Shield, Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'logged-in'])

const authStore = useAuthStore()

// State
const activeTab = ref('login') // 'login' | 'register'
const errorMsg = ref('')

// Login fields
const loginUsername = ref('')
const loginPassword = ref('')

// Register fields
const regUsername = ref('')
const regWizardName = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')

function switchTab(tab) {
  activeTab.value = tab
  errorMsg.value = ''
}

function resetForm() {
  loginUsername.value = ''
  loginPassword.value = ''
  regUsername.value = ''
  regWizardName.value = ''
  regPassword.value = ''
  regConfirmPassword.value = ''
  errorMsg.value = ''
}

function handleClose() {
  resetForm()
  emit('close')
}

async function handleLogin() {
  errorMsg.value = ''
  const trimmedUser = loginUsername.value.trim()
  if (!trimmedUser) {
    errorMsg.value = '请输入巫师学号或用户名'
    return
  }
  if (!loginPassword.value) {
    errorMsg.value = '请输入通行密码'
    return
  }

  try {
    const data = await authStore.login(trimmedUser, loginPassword.value)
    emit('logged-in', data)
    handleClose()
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请检查用户名与密码'
  }
}

async function handleRegister() {
  errorMsg.value = ''
  const trimmedUser = regUsername.value.trim()
  if (!trimmedUser) {
    errorMsg.value = '请设置用户名'
    return
  }

  const userRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!userRegex.test(trimmedUser)) {
    errorMsg.value = '用户名需为 3–20 位字母、数字或下划线'
    return
  }

  if (!regPassword.value || regPassword.value.length < 6) {
    errorMsg.value = '密码长度至少需 6 位字符'
    return
  }

  if (regPassword.value !== regConfirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  try {
    const data = await authStore.register(
      trimmedUser,
      regPassword.value,
      regWizardName.value.trim() || undefined
    )
    emit('logged-in', data)
    handleClose()
  } catch (err) {
    errorMsg.value = err.message || '注册失败，请稍后重试'
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      resetForm()
    }
  }
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
