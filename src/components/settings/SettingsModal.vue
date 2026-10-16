<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-4"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        @click="emit('close')"
        aria-hidden="true"
      ></div>

      <!-- Modal Card -->
      <div
        class="relative z-10 max-w-2xl w-full mx-4 bg-[#fbf9f5] border border-[#e8ddd0] rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[640px] md:h-[620px] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="设置中心与管理员控制台"
        @click.stop
      >
        <!-- Left Column: Navigation Tabs -->
        <div
          class="w-full md:w-56 shrink-0 bg-[#f5efe6] border-b md:border-b-0 md:border-r border-[#e8ddd0] flex flex-col md:h-full overflow-hidden"
        >
          <!-- Header (Settings title + mobile close) -->
          <div
            class="p-3 md:p-4 border-b border-[#e8ddd0] flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900"
              >
                <Settings class="w-4 h-4" />
              </div>
              <h2 class="font-serif text-sm md:text-base font-semibold text-stone-900">
                设置中心
              </h2>
            </div>
            <!-- Mobile close button -->
            <button
              type="button"
              @click="emit('close')"
              class="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white/80 flex items-center justify-center touch-manipulation cursor-pointer active:scale-95"
              aria-label="关闭设置"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Nav Tabs -->
          <nav
            class="flex-1 p-2 md:p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto"
          >
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              @click="activeTab = tab.key"
              :class="[
                'min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-xs transition-all text-left whitespace-nowrap cursor-pointer',
                activeTab === tab.key
                  ? 'bg-amber-100/90 text-amber-950 border-l-4 border-l-amber-700 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80 font-medium'
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4 shrink-0" />
              <span>{{ tab.label }}</span>
            </button>
          </nav>

          <!-- Desktop Close in bottom of left bar -->
          <div class="hidden md:block p-3 border-t border-[#e8ddd0] bg-white/40">
            <button
              type="button"
              @click="emit('close')"
              class="w-full min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white/80 flex items-center justify-center gap-2 text-xs font-medium border border-[#e8ddd0] touch-manipulation active:scale-95 cursor-pointer"
            >
              <X class="w-4 h-4" />
              <span>关闭设置</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Content Area -->
        <div class="flex-1 min-h-0 h-full overflow-y-auto p-4 md:p-6 bg-[#fbf9f5] flex flex-col space-y-6">
          <!-- Desktop top close button -->
          <div class="hidden md:flex justify-end -mt-2 -mr-2">
            <button
              type="button"
              @click="emit('close')"
              class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 flex items-center justify-center transition-colors cursor-pointer touch-manipulation active:scale-95"
              aria-label="关闭设置"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- TAB 1: 学籍与激活 (Account) -->
          <div v-if="activeTab === 'account'" class="space-y-6">
            <div>
              <h3 class="font-serif text-base font-bold text-stone-900">
                学籍档案与激活
              </h3>
              <p class="text-xs text-stone-500 mt-1">
                查看您的霍格沃茨学籍状态，兑换专属 Pro 研学卡密
              </p>
            </div>

            <!-- Profile Info Card -->
            <div
              v-if="authStore.isLoggedIn"
              class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl flex items-center gap-3.5"
            >
              <div
                class="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0"
              >
                <component :is="currentAvatarComponent" class="w-6 h-6" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-bold text-stone-900 truncate">
                    {{ authStore.currentUser?.wizardName || authStore.currentUser?.username }}
                  </span>
                  <span
                    v-if="authStore.isPro"
                    class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold"
                  >
                    <Sparkles class="w-3 h-3" />
                    Pro 尊享
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 font-bold"
                  >
                    普通学员
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-stone-500 flex-wrap">
                  <span>学号: @{{ authStore.currentUser?.username }}</span>
                  <span v-if="authStore.isPro">
                    有效期: {{ formatExpiry(authStore.currentUser?.proExpiresAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Guest notice if not logged in -->
            <div
              v-else
              class="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2"
            >
              <AlertCircle class="w-4 h-4 text-amber-700 shrink-0" />
              <span>当前为访客状态，请先登录学籍以绑定激活卡密。</span>
            </div>

            <!-- Activation Code Section -->
            <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3">
              <div class="flex items-center gap-2">
                <Key class="w-4 h-4 text-amber-700" />
                <h4 class="text-xs font-bold text-stone-900">
                  兑换激活码
                </h4>
              </div>
              <p class="text-[11px] text-stone-500">
                输入 13 位 Hogwarts Pro 激活码，激活后特权有效期顺延叠加
              </p>

              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="activationCodeInput"
                  type="text"
                  placeholder="HP-M30-XXXXXX"
                  class="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#e8ddd0] bg-white text-stone-900 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 touch-manipulation"
                />
                <button
                  type="button"
                  @click="handleRedeemActivation"
                  :disabled="redeemIsLoading || !activationCodeInput.trim()"
                  class="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-amber-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer transition-colors shrink-0"
                >
                  <RefreshCw
                    v-if="redeemIsLoading"
                    class="w-4 h-4 animate-spin text-amber-100"
                  />
                  <span>兑换激活码</span>
                </button>
              </div>

              <!-- Redeem feedback status -->
              <div
                v-if="redeemSuccessMsg"
                class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5"
              >
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{{ redeemSuccessMsg }}</span>
              </div>
              <div
                v-if="redeemErrorMsg"
                class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5"
              >
                <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
                <span>{{ redeemErrorMsg }}</span>
              </div>
            </div>

            <!-- Avatar Picker Section -->
            <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3">
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-amber-700" />
                <h4 class="text-xs font-bold text-stone-900">
                  魔法头像选择
                </h4>
              </div>
              <p class="text-[11px] text-stone-500">
                选择专属巫师档案徽记（共 12 款），即时同步学籍信息
              </p>

              <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                <button
                  v-for="preset in AVATAR_PRESETS"
                  :key="preset.id"
                  type="button"
                  @click="handleSelectAvatar(preset.id)"
                  :class="[
                    'min-h-[44px] min-w-[44px] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation active:scale-95',
                    currentAvatarId === preset.id
                      ? 'border-2 border-amber-700 bg-amber-100/90 text-amber-900 font-bold'
                      : 'border border-[#e8ddd0] bg-white text-stone-600 hover:border-amber-400 hover:bg-stone-50'
                  ]"
                  :title="preset.label"
                  :aria-label="preset.label"
                >
                  <component :is="preset.icon" class="w-5 h-5 shrink-0" />
                  <span class="text-[10px] leading-none truncate max-w-full">
                    {{ preset.label }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 2: 快捷键指南 (Shortcuts) -->
          <div v-else-if="activeTab === 'shortcuts'" class="space-y-4">
            <div>
              <h3 class="font-serif text-base font-bold text-stone-900">
                快捷键指南
              </h3>
              <p class="text-xs text-stone-500 mt-1">
                掌握键盘快捷键，大幅提升英语听读研学效率
              </p>
            </div>

            <div class="space-y-2">
              <div
                v-for="item in SHORTCUTS_LIST"
                :key="item.key"
                class="p-3 bg-white/80 border border-[#e8ddd0] rounded-xl flex items-center justify-between gap-3"
              >
                <span class="text-xs text-stone-800 font-medium">
                  {{ item.desc }}
                </span>
                <kbd
                  class="px-2.5 py-1 text-xs font-mono font-semibold bg-white/90 border border-[#e8ddd0] text-stone-800 rounded-lg shadow-inner shrink-0"
                >
                  {{ item.key }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- TAB 3: 研学公约 (Covenant) -->
          <div v-else-if="activeTab === 'covenant'" class="space-y-5">
            <div>
              <h3 class="font-serif text-base font-bold text-stone-900">
                研学公约与法律声明
              </h3>
              <p class="text-xs text-stone-500 mt-1">
                维护纯洁学术环境与未成年人安全研学准则
              </p>
            </div>

            <div class="space-y-4 text-xs text-stone-700 leading-relaxed">
              <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-1.5">
                <h4 class="font-bold text-stone-900 text-xs">
                  1. 非商业学术研学用途 (Academic Fair Use)
                </h4>
                <p class="text-stone-600 text-[11px]">
                  本项目属于非商业学术研究与英语能力评测探索平台。所涉音频原著语料仅供个人学术研学、听辨跟读及双语对照研究，严禁任何形式的商业转售、批量转录或收费镜像分发。
                </p>
              </div>

              <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-1.5">
                <h4 class="font-bold text-stone-900 text-xs">
                  2. 青少年隐私保护与合规 (COPPA Compliance)
                </h4>
                <p class="text-stone-600 text-[11px]">
                  本平台严格恪守儿童与青少年在线隐私保护规范（COPPA）。全部练习听写、词汇掌握度与评测数据优先留存于本地浏览器 IndexedDB 数据库中，不采集任何生物面部信息或地理位置隐私。
                </p>
              </div>

              <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-1.5">
                <h4 class="font-bold text-stone-900 text-xs">
                  3. DMCA 声明与版权反馈通道 (DMCA Channel)
                </h4>
                <p class="text-stone-600 text-[11px]">
                  若版权所有方认为本站研学展示资料存在任何不妥或侵权争议，请通过研学理事会反馈通道提交 DMCA 申诉，我们将在 24 小时内核验并下架相关内容。
                </p>
              </div>
            </div>
          </div>

          <!-- TAB 4: 管理员通道 (Admin Console) -->
          <div v-else-if="activeTab === 'admin'" class="space-y-6">
            <div>
              <h3 class="font-serif text-base font-bold text-stone-900">
                管理员通道
              </h3>
              <p class="text-xs text-stone-500 mt-1">
                卡密批量生成、学员权益发放与全量激活码作废控制台
              </p>
            </div>

            <!-- Unverified State: Password Input -->
            <div
              v-if="!isAdminVerified"
              class="p-5 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3"
            >
              <div class="flex items-center gap-2">
                <Shield class="w-4 h-4 text-amber-700" />
                <h4 class="text-xs font-bold text-stone-900">
                  教务管理密钥验证
                </h4>
              </div>
              <p class="text-[11px] text-stone-500">
                此控制台受环境变量 ADMIN_SECRET_KEY 保护，请输入密钥以解锁权限
              </p>

              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="adminKey"
                  type="password"
                  placeholder="请输入管理员密钥 (ADMIN_SECRET_KEY)"
                  class="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#e8ddd0] bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 touch-manipulation"
                />
                <button
                  type="button"
                  @click="handleVerifyAdminKey"
                  :disabled="adminIsLoading || !adminKey.trim()"
                  class="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-amber-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer transition-colors shrink-0"
                >
                  <RefreshCw
                    v-if="adminIsLoading"
                    class="w-4 h-4 animate-spin text-amber-100"
                  />
                  <span>验证密钥</span>
                </button>
              </div>

              <div
                v-if="adminErrorMsg"
                class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5"
              >
                <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
                <span>{{ adminErrorMsg }}</span>
              </div>
            </div>

            <!-- Verified State: Generator + List -->
            <div v-else class="space-y-6">
              <!-- Verified Status Banner -->
              <div
                class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-medium"
              >
                <div class="flex items-center gap-2">
                  <Shield class="w-4 h-4 text-emerald-700" />
                  <span>管理员身份已验证</span>
                </div>
                <button
                  type="button"
                  @click="handleLogoutAdmin"
                  class="text-xs text-emerald-700 underline cursor-pointer"
                >
                  退出管理
                </button>
              </div>

              <!-- Section 1: Batch Code Generator -->
              <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-4">
                <div class="flex items-center gap-2">
                  <Key class="w-4 h-4 text-amber-700" />
                  <h4 class="text-xs font-bold text-stone-900">
                    批量生成激活码
                  </h4>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">
                      卡密类型
                    </label>
                    <select
                      v-model="generateType"
                      class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e8ddd0] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600 touch-manipulation"
                    >
                      <option value="MONTH_30">月卡 (30天) - HP-M30-</option>
                      <option value="SEASON_90">季卡 (90天) - HP-Q90-</option>
                      <option value="YEAR_365">年卡 (365天) - HP-Y365-</option>
                      <option value="FOREVER">永久 Pro (无期限) - HP-PRO-</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-stone-700 mb-1">
                      生成数量 (1-50)
                    </label>
                    <input
                      v-model.number="generateCount"
                      type="number"
                      min="1"
                      max="50"
                      class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#e8ddd0] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600 touch-manipulation"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  @click="handleGenerateCodes"
                  :disabled="generatorIsLoading"
                  class="min-h-[44px] min-w-[44px] w-full px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-amber-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer transition-colors"
                >
                  <RefreshCw
                    v-if="generatorIsLoading"
                    class="w-4 h-4 animate-spin text-amber-100"
                  />
                  <span>批量生成激活码</span>
                </button>

                <div
                  v-if="generatorErrorMsg"
                  class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700"
                >
                  {{ generatorErrorMsg }}
                </div>

                <!-- Generated Codes Result Box -->
                <div v-if="generatedCodes.length > 0" class="space-y-2 pt-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-stone-800">
                      最新生成卡密 ({{ generatedCodes.length }} 条)
                    </span>
                    <button
                      type="button"
                      @click="copyAllGeneratedCodes"
                      class="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 rounded-lg flex items-center gap-1.5 touch-manipulation active:scale-95 cursor-pointer"
                    >
                      <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-600" />
                      <Copy v-else class="w-3.5 h-3.5" />
                      <span>{{ isCopied ? '已复制全部' : '一键复制全部' }}</span>
                    </button>
                  </div>
                  <pre
                    class="p-3 bg-[#f5efe6] border border-[#e8ddd0] rounded-xl text-xs font-mono text-stone-800 max-h-40 overflow-y-auto whitespace-pre leading-relaxed select-all"
                  >{{ generatedCodes.join('\n') }}</pre>
                </div>
              </div>

              <!-- Section 2: Activation List Table -->
              <div class="p-4 bg-white/80 border border-[#e8ddd0] rounded-xl space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <BookOpen class="w-4 h-4 text-amber-700" />
                    <h4 class="text-xs font-bold text-stone-900">
                      激活码列表 ({{ activationCodesList.length }})
                    </h4>
                  </div>
                  <button
                    type="button"
                    @click="fetchActivationList"
                    :disabled="adminListLoading"
                    class="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 touch-manipulation cursor-pointer"
                  >
                    <RefreshCw
                      class="w-3.5 h-3.5"
                      :class="{ 'animate-spin': adminListLoading }"
                    />
                    <span>刷新</span>
                  </button>
                </div>

                <div
                  v-if="revokeErrorMsg"
                  class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700"
                >
                  {{ revokeErrorMsg }}
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-[#e8ddd0] text-stone-500 font-medium">
                        <th class="py-2 px-2">激活码</th>
                        <th class="py-2 px-2">类型</th>
                        <th class="py-2 px-2">状态</th>
                        <th class="py-2 px-2">兑换者</th>
                        <th class="py-2 px-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#e8ddd0]/60">
                      <tr
                        v-for="item in activationCodesList"
                        :key="item.code"
                        class="hover:bg-amber-50/40"
                      >
                        <td class="py-2 px-2 font-mono font-bold text-stone-800">
                          {{ item.code }}
                        </td>
                        <td class="py-2 px-2 text-stone-600">
                          {{ formatCodeType(item.type) }}
                        </td>
                        <td class="py-2 px-2">
                          <span
                            v-if="item.revoked"
                            class="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-bold"
                          >
                            已作废
                          </span>
                          <span
                            v-else-if="item.redeemedAt"
                            class="px-1.5 py-0.5 rounded text-[10px] bg-stone-200 text-stone-700 font-medium"
                          >
                            已兑换
                          </span>
                          <span
                            v-else
                            class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold"
                          >
                            未使用
                          </span>
                        </td>
                        <td class="py-2 px-2 font-mono text-stone-500">
                          {{ item.redeemedBy || '-' }}
                        </td>
                        <td class="py-2 px-2 text-right">
                          <button
                            type="button"
                            @click="handleRevokeCode(item.code)"
                            :disabled="item.revoked"
                            class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none inline-flex items-center justify-center touch-manipulation active:scale-95 cursor-pointer"
                            title="作废此激活码"
                            aria-label="作废此激活码"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      <tr v-if="activationCodesList.length === 0">
                        <td colspan="5" class="py-6 text-center text-stone-400">
                          暂无激活码数据
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  X,
  Key,
  Sparkles,
  Shield,
  Settings,
  User,
  Copy,
  Check,
  Trash2,
  BookOpen,
  Keyboard,
  Glasses,
  Book,
  Wand2,
  GraduationCap,
  Star,
  Bird,
  Castle,
  Flame,
  Crown,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore.js'

defineOptions({
  name: 'SettingsModal'
})

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()

// Active navigation tab
const activeTab = ref('account')

const tabs = [
  { key: 'account', label: '学籍与激活', icon: User },
  { key: 'shortcuts', label: '快捷键指南', icon: Keyboard },
  { key: 'covenant', label: '研学公约', icon: BookOpen },
  { key: 'admin', label: '管理员通道', icon: Shield }
]

// 12 Preset Avatars
const AVATAR_PRESETS = [
  { id: 'user', label: '巫师学者', icon: User },
  { id: 'glasses', label: '圆框眼镜', icon: Glasses },
  { id: 'book', label: '魔法典籍', icon: Book },
  { id: 'wand', label: '魔杖指引', icon: Wand2 },
  { id: 'hat', label: '分院礼帽', icon: GraduationCap },
  { id: 'star', label: '晨星徽章', icon: Star },
  { id: 'owl', label: '信使猫头鹰', icon: Bird },
  { id: 'castle', label: '霍格沃茨', icon: Castle },
  { id: 'flame', label: '永恒烈焰', icon: Flame },
  { id: 'crown', label: '学院桂冠', icon: Crown },
  { id: 'lightning', label: '闪电印记', icon: Zap },
  { id: 'shield', label: '守护之盾', icon: Shield }
]

const currentAvatarId = computed(() => {
  return authStore.avatarId || 'user'
})

const currentAvatarComponent = computed(() => {
  const match = AVATAR_PRESETS.find(p => p.id === currentAvatarId.value)
  return match ? match.icon : User
})

async function handleSelectAvatar(avatarId) {
  try {
    await authStore.setAvatar(avatarId)
  } catch (err) {
    console.error('Failed to update avatar', err)
  }
}

// Activation code redemption state
const activationCodeInput = ref('')
const redeemIsLoading = ref(false)
const redeemSuccessMsg = ref('')
const redeemErrorMsg = ref('')

async function handleRedeemActivation() {
  const code = activationCodeInput.value.trim().toUpperCase()
  if (!code) return

  redeemIsLoading.value = true
  redeemSuccessMsg.value = ''
  redeemErrorMsg.value = ''

  try {
    const data = await authStore.redeemActivation(code)
    redeemSuccessMsg.value = data.message || '恭喜！Pro 研学权益已成功激活顺延。'
    activationCodeInput.value = ''
  } catch (err) {
    redeemErrorMsg.value = err.message || '激活失败，请检查激活码或学籍状态。'
  } finally {
    redeemIsLoading.value = false
  }
}

function formatExpiry(timestamp) {
  if (timestamp === null || timestamp === undefined) return '永久有效'
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return '永久有效'
    return d.toISOString().split('T')[0]
  } catch {
    return '永久有效'
  }
}

// Shortcuts list
const SHORTCUTS_LIST = [
  { key: 'Space', desc: '播放 / 暂停音频' },
  { key: '← (Left)', desc: '快退 5 秒' },
  { key: '→ (Right)', desc: '快进 5 秒' },
  { key: '轻点字幕', desc: '跳转至对应句子起播' },
  { key: '盲听模式', desc: '开启迷雾遮罩强制听音辨意' },
  { key: 'Ctrl + B', desc: '展开 / 收起主侧边栏' },
  { key: '?', desc: '随时唤起操作快捷键指南' }
]

// Admin Tab State
const adminKey = ref('')
const isAdminVerified = ref(false)
const adminIsLoading = ref(false)
const adminErrorMsg = ref('')

const generateType = ref('MONTH_30')
const generateCount = ref(5)
const generatorIsLoading = ref(false)
const generatorErrorMsg = ref('')
const generatedCodes = ref([])
const isCopied = ref(false)

const activationCodesList = ref([])
const adminListLoading = ref(false)
const revokeErrorMsg = ref('')

async function handleVerifyAdminKey() {
  if (!adminKey.value.trim()) {
    adminErrorMsg.value = '请输入管理员密钥'
    return
  }

  adminIsLoading.value = true
  adminErrorMsg.value = ''

  try {
    const res = await fetch('/api/admin/activation/list', {
      headers: {
        'x-admin-key': adminKey.value.trim()
      }
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const msg =
        data.error === 'INVALID_ADMIN_KEY'
          ? '管理员密钥无效，请核对后重试'
          : data.error === 'ADMIN_CONFIG_MISSING'
            ? '服务端未配置 ADMIN_SECRET_KEY'
            : data.message || '验证失败'
      throw new Error(msg)
    }

    isAdminVerified.value = true
    activationCodesList.value = data.codes || []
  } catch (err) {
    adminErrorMsg.value = err.message || '验证失败'
    isAdminVerified.value = false
  } finally {
    adminIsLoading.value = false
  }
}

function handleLogoutAdmin() {
  isAdminVerified.value = false
  adminKey.value = ''
  generatedCodes.value = []
  activationCodesList.value = []
}

async function fetchActivationList() {
  if (!adminKey.value.trim()) return
  adminListLoading.value = true
  revokeErrorMsg.value = ''

  try {
    const res = await fetch('/api/admin/activation/list', {
      headers: {
        'x-admin-key': adminKey.value.trim()
      }
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || '获取激活码列表失败')
    }
    activationCodesList.value = data.codes || []
  } catch (err) {
    revokeErrorMsg.value = err.message || '获取激活码列表失败'
  } finally {
    adminListLoading.value = false
  }
}

async function handleGenerateCodes() {
  if (generateCount.value < 1 || generateCount.value > 50) {
    generatorErrorMsg.value = '生成数量必须在 1 到 50 之间'
    return
  }

  generatorIsLoading.value = true
  generatorErrorMsg.value = ''

  try {
    const res = await fetch('/api/admin/activation/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey.value.trim()
      },
      body: JSON.stringify({
        type: generateType.value,
        count: generateCount.value
      })
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || '批量生成激活码失败')
    }

    generatedCodes.value = data.codes || []
    await fetchActivationList()
  } catch (err) {
    generatorErrorMsg.value = err.message || '批量生成激活码失败'
  } finally {
    generatorIsLoading.value = false
  }
}

async function copyAllGeneratedCodes() {
  if (!generatedCodes.value.length) return
  const text = generatedCodes.value.join('\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy generated codes', err)
  }
}

async function handleRevokeCode(code) {
  revokeErrorMsg.value = ''
  try {
    const res = await fetch('/api/admin/activation/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey.value.trim()
      },
      body: JSON.stringify({ code })
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || '作废激活码失败')
    }

    await fetchActivationList()
  } catch (err) {
    revokeErrorMsg.value = err.message || '作废激活码失败'
  }
}

function formatCodeType(type) {
  switch (type) {
    case 'MONTH_30':
      return '月卡 (30天)'
    case 'SEASON_90':
      return '季卡 (90天)'
    case 'YEAR_365':
      return '年卡 (365天)'
    case 'FOREVER':
      return '永久 Pro'
    default:
      return type || '-'
  }
}

// Global Escape listener
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
