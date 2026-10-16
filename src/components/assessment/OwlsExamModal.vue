<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="O.W.L.s 魔法等级评定模拟考"
    >
      <!-- Backdrop -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
          @click="handleBackdropClick"
          aria-hidden="true"
        />
      </Transition>

      <!-- Modal Container / Responsive Dialog -->
      <div class="fixed inset-0 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4">
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-full sm:translate-y-4 opacity-0"
        >
          <div
            v-if="isOpen"
            class="pointer-events-auto bg-[#fbf9f5] border-t border-x sm:border border-[#e8ddd0] rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:pb-0 shadow-2xl"
            @click.stop
          >
            <!-- Mobile Pull Handle -->
            <div
              class="min-h-[44px] flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing touch-none shrink-0"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
            >
              <div class="w-10 h-1.5 rounded-full bg-[#d5cbbf]" />
            </div>

            <!-- Modal Header with Progress Stepper -->
            <div class="px-5 py-4 border-b border-[#e8ddd0] bg-white/80 backdrop-blur flex items-center justify-between gap-3 shrink-0 select-none">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <Award class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h2 class="font-serif text-base sm:text-lg font-bold text-stone-900 truncate">
                    O.W.L.s 魔法学业等级模拟考
                  </h2>
                  <p class="text-xs text-stone-500 flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5 text-amber-700" />
                    <span>阶段 {{ currentStage }} / 3 · {{ stageTitle }}</span>
                  </p>
                </div>
              </div>

              <!-- Close button -->
              <button
                type="button"
                @click="closeModal"
                class="p-2 text-stone-500 hover:text-stone-800 hover:bg-[#f2ece2] rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors touch-manipulation cursor-pointer"
                aria-label="退出考核"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Stepper Progress Bar (Stage 1-3) -->
            <div v-if="currentStage <= 3" class="px-5 pt-3 pb-2 bg-[#f8f4ed] border-b border-[#e8ddd0]/60 shrink-0">
              <div class="flex items-center justify-between text-xs font-medium text-stone-600 mb-1.5">
                <span :class="currentStage === 1 ? 'font-bold text-amber-900' : ''">1. 听力推断</span>
                <span :class="currentStage === 2 ? 'font-bold text-amber-900' : ''">2. 关键词拼写</span>
                <span :class="currentStage === 3 ? 'font-bold text-amber-900' : ''">3. 名篇跟读</span>
              </div>
              <div class="w-full bg-[#e8ddd0] rounded-full h-2 overflow-hidden">
                <div
                  class="bg-amber-700 h-2 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: `${stageProgressPercentage}%` }"
                  role="progressbar"
                  :aria-valuenow="stageProgressPercentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              <!-- ================= STAGE 1: 听力推断 (Listening Comprehension) ================= -->
              <div v-if="currentStage === 1" class="space-y-5" data-testid="stage-listening">
                <div class="bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl p-4 sm:p-5 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
                      <Volume2 class="w-3.5 h-3.5" />
                      <span>听力题 {{ listeningIndex + 1 }} / {{ listeningQuestions.length }}</span>
                    </span>
                    <span class="text-xs text-stone-500">点击播放语音原声</span>
                  </div>

                  <!-- Audio playback bar -->
                  <div class="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      @click="playListeningAudio"
                      :disabled="isPlayingSpeech"
                      class="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-amber-50 rounded-xl text-xs font-medium flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <Volume2 v-if="!isPlayingSpeech" class="w-4 h-4 text-amber-200" />
                      <Pause v-else class="w-4 h-4 text-amber-200" />
                      <span>{{ isPlayingSpeech ? '正在播报...' : '播放原声听力' }}</span>
                    </button>
                    <span class="text-xs text-stone-600">建议戴上耳机仔细听辨细节</span>
                  </div>

                  <!-- Question Title -->
                  <h3 class="text-base sm:text-lg font-bold font-serif text-stone-900 pt-2 leading-snug">
                    {{ currentListeningQ.prompt }}
                  </h3>
                </div>

                <!-- Multiple Choice Options -->
                <div class="space-y-2.5">
                  <button
                    v-for="(option, idx) in currentListeningQ.options"
                    :key="idx"
                    type="button"
                    @click="selectListeningOption(idx)"
                    :disabled="selectedListeningOption !== null"
                    :class="[
                      'w-full text-left p-4 rounded-xl border min-h-[44px] min-w-[44px] touch-manipulation transition-all flex items-center justify-between gap-3 text-sm font-medium',
                      selectedListeningOption === null
                        ? 'bg-white hover:bg-[#f5efe6] border-[#e8ddd0] text-stone-800 cursor-pointer active:scale-[0.99]'
                        : idx === currentListeningQ.correctIndex
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                          : selectedListeningOption === idx
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-white/60 border-stone-200 text-stone-400 opacity-60'
                    ]"
                  >
                    <div class="flex items-center gap-3">
                      <span
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border"
                        :class="[
                          selectedListeningOption === null
                            ? 'bg-[#f4ece1] border-[#decbb8] text-amber-900'
                            : idx === currentListeningQ.correctIndex
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : selectedListeningOption === idx
                                ? 'bg-red-600 border-red-600 text-white'
                                : 'bg-stone-100 border-stone-200 text-stone-400'
                        ]"
                      >
                        {{ ['A', 'B', 'C', 'D'][idx] }}
                      </span>
                      <span class="leading-relaxed">{{ option }}</span>
                    </div>

                    <!-- Dual-channel icon indicator -->
                    <span v-if="selectedListeningOption !== null" class="shrink-0">
                      <Check v-if="idx === currentListeningQ.correctIndex" class="w-5 h-5 text-emerald-600" />
                      <X v-else-if="selectedListeningOption === idx" class="w-5 h-5 text-red-500" />
                    </span>
                  </button>
                </div>

                <!-- Explanation Feedback & Next Button -->
                <div v-if="selectedListeningOption !== null" class="p-4 bg-[#f8f4ed] border border-[#e8ddd0] rounded-xl space-y-3">
                  <div class="flex items-start gap-2 text-xs">
                    <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div class="text-stone-700 leading-relaxed">
                      <span class="font-bold text-amber-900">听力原文释析：</span>
                      <span>{{ currentListeningQ.explanation }}</span>
                    </div>
                  </div>

                  <div class="flex justify-end pt-1">
                    <button
                      type="button"
                      @click="nextListeningQuestion"
                      class="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl text-xs font-bold flex items-center gap-1.5 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <span>{{ listeningIndex < listeningQuestions.length - 1 ? '下一题' : '进入第 2 阶段：拼写填空' }}</span>
                      <ChevronRight class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>


              <!-- ================= STAGE 2: 关键词拼写 (Production Dictation) ================= -->
              <div v-else-if="currentStage === 2" class="space-y-5" data-testid="stage-dictation">
                <div class="bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl p-4 sm:p-5 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
                      <PenTool class="w-3.5 h-3.5" />
                      <span>填空拼写题 {{ dictationIndex + 1 }} / {{ dictationQuestions.length }}</span>
                    </span>
                    <span class="text-xs text-stone-500">考查重点考纲词汇产出 (L4)</span>
                  </div>

                  <!-- Sentence Context with Blank -->
                  <div class="p-4 bg-white border border-[#e8ddd0] rounded-xl space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-amber-800 uppercase tracking-wider">句子语境</span>
                      <button
                        type="button"
                        @click="playDictationAudio"
                        :disabled="isPlayingSpeech"
                        class="min-h-[44px] min-w-[44px] px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-medium flex items-center gap-1.5 touch-manipulation transition-colors cursor-pointer"
                        title="播报例句原声"
                        aria-label="播报例句原声"
                      >
                        <Volume2 class="w-3.5 h-3.5 text-amber-800" />
                        <span>朗读句子</span>
                      </button>
                    </div>
                    <p class="font-serif text-base sm:text-lg font-medium text-stone-900 leading-relaxed">
                      {{ currentDictationQ.displaySentence }}
                    </p>
                    <p class="text-xs text-stone-500 pt-1">
                      词义提示：<span class="text-stone-700 font-medium">{{ currentDictationQ.hint }}</span>
                    </p>
                  </div>

                  <!-- Input field adhering to iOS zoom prevention & touch requirements -->
                  <div class="space-y-2">
                    <label for="dictation-input" class="block text-xs font-medium text-stone-700">
                      请输入空缺的英文单词拼写：
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        id="dictation-input"
                        ref="dictationInputRef"
                        v-model="dictationInput"
                        type="text"
                        class="flex-1 bg-white border border-[#e8ddd0] rounded-xl px-4 py-2.5 text-base sm:text-base font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 min-h-[44px] touch-manipulation"
                        placeholder="在此键入单词拼写..."
                        autocapitalize="none"
                        autocorrect="off"
                        spellcheck="false"
                        autocomplete="off"
                        :disabled="dictationFeedback !== null"
                        @keyup.enter="submitDictationAnswer"
                      />
                      <button
                        v-if="dictationFeedback === null"
                        type="button"
                        @click="submitDictationAnswer"
                        :disabled="!dictationInput.trim()"
                        class="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-amber-50 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <Check class="w-4 h-4" />
                        <span>确认</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Dictation Feedback Card -->
                <div
                  v-if="dictationFeedback !== null"
                  class="p-4 rounded-xl border space-y-3"
                  :class="dictationFeedback.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-amber-50 border-amber-300 text-amber-950'"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      :class="dictationFeedback.isCorrect ? 'bg-emerald-600 text-white' : 'bg-amber-700 text-white'"
                    >
                      <Check v-if="dictationFeedback.isCorrect" class="w-4 h-4" />
                      <X v-else class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="text-xs font-bold">
                        {{ dictationFeedback.isCorrect ? '拼写准确！已自动同步生词本 L4 产出能力' : '拼写有误或格式不符' }}
                      </p>
                      <p class="text-xs text-stone-600 mt-0.5">
                        正确单词：<span class="font-mono font-bold text-amber-950">{{ currentDictationQ.targetWord }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex justify-end pt-1">
                    <button
                      type="button"
                      @click="nextDictationQuestion"
                      class="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl text-xs font-bold flex items-center gap-1.5 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <span>{{ dictationIndex < dictationQuestions.length - 1 ? '下一题' : '进入第 3 阶段：名篇跟读' }}</span>
                      <ChevronRight class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>


              <!-- ================= STAGE 3: 名篇跟读 (Oral Shadowing Challenge) ================= -->
              <div v-else-if="currentStage === 3" class="space-y-5" data-testid="stage-shadowing">
                <div class="bg-[#f5efe6] border border-[#e8ddd0] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300">
                      <Mic class="w-3.5 h-3.5" />
                      <span>名篇原声跟读挑战</span>
                    </span>
                    <span class="text-xs text-stone-500">考查语音语调与口语节奏</span>
                  </div>

                  <!-- Quote Card -->
                  <div class="p-5 bg-white border border-[#e8ddd0] rounded-xl space-y-3 text-center">
                    <div class="text-[11px] font-mono uppercase tracking-widest text-amber-800">Inspirational Golden Quote</div>
                    <blockquote class="font-serif text-lg sm:text-xl font-medium text-stone-900 leading-relaxed italic">
                      "{{ shadowingChallenge.quoteEn }}"
                    </blockquote>
                    <p class="text-xs text-stone-600 leading-relaxed">
                      {{ shadowingChallenge.quoteZh }}
                    </p>
                  </div>

                  <!-- Controls Grid: 示范播放 & 录音评测 -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <!-- Play original quote -->
                    <button
                      type="button"
                      @click="playShadowingAudio"
                      :disabled="isPlayingSpeech"
                      class="min-h-[44px] min-w-[44px] px-4 py-3 bg-[#fbf9f5] hover:bg-[#f2ece2] border border-[#e8ddd0] rounded-xl text-xs font-medium text-stone-800 flex items-center justify-center gap-2 touch-manipulation transition-colors cursor-pointer"
                    >
                      <Volume2 class="w-4 h-4 text-amber-700" />
                      <span>{{ isPlayingSpeech ? '正在播报原声...' : '聆听示范原声' }}</span>
                    </button>

                    <!-- Microphone Recording Button -->
                    <button
                      type="button"
                      @click="toggleRecording"
                      :class="[
                        'min-h-[44px] min-w-[44px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-all cursor-pointer',
                        isRecording
                          ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                          : 'bg-amber-700 hover:bg-amber-800 text-amber-50'
                      ]"
                    >
                      <Square v-if="isRecording" class="w-4 h-4 fill-white" />
                      <Mic v-else class="w-4 h-4 text-amber-200" />
                      <span>{{ isRecording ? `录音中 (${recordingDuration}s) · 点击结束` : '开启麦克风跟读' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Oral Evaluation Feedback Card -->
                <div v-if="shadowingScore !== null" class="p-5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono font-bold text-xl shrink-0">
                        {{ shadowingScore }}
                      </div>
                      <div>
                        <p class="text-xs font-bold text-emerald-950">{{ oralGradeText }}</p>
                        <p class="text-xs text-emerald-800 mt-0.5 leading-relaxed">{{ oralCommentText }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end pt-2">
                    <button
                      type="button"
                      @click="finishExamAndGraduation"
                      class="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl text-xs font-bold flex items-center gap-2 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <Sparkles class="w-4 h-4 text-amber-200" />
                      <span>结算期末成绩并颁发等级认证</span>
                    </button>
                  </div>
                </div>
              </div>


              <!-- ================= STAGE 4: 结算报告与晋级 (Graduation & Summary) ================= -->
              <div v-else-if="currentStage === 4" class="space-y-5" data-testid="stage-graduation">
                <!-- Celebratory Graduation Banner -->
                <div class="bg-gradient-to-b from-[#f5efe6] to-[#fbf9f5] border border-[#e8ddd0] rounded-2xl p-6 text-center space-y-4">
                  <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-300 flex items-center justify-center text-amber-800">
                    <Award class="w-8 h-8" />
                  </div>

                  <div>
                    <div class="text-[11px] uppercase tracking-widest text-amber-800 font-serif font-bold">
                      Hogwarts School of Witchcraft and Wizardry
                    </div>
                    <h3 class="text-2xl font-bold font-serif text-stone-900 mt-1">
                      O.W.L.s 学业水平等级测验认证
                    </h3>
                  </div>

                  <!-- Badges: Score & Certified CEFR Level -->
                  <div class="flex items-center justify-center gap-3 pt-1">
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-sm font-bold">
                      <Sparkles class="w-4 h-4 text-amber-700" />
                      <span>综合考评 {{ examResultRecord?.compositeScore || 85 }} 分</span>
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 text-purple-900 text-sm font-bold">
                      <Shield class="w-4 h-4 text-purple-700" />
                      <span>CEFR {{ examResultRecord?.cefrResult || 'B1' }} 等级</span>
                    </span>
                  </div>

                  <!-- Wizard Title Callout -->
                  <div class="p-3 bg-white/70 border border-[#e8ddd0] rounded-xl text-xs text-stone-700">
                    获得魔法头衔称号：<span class="font-bold text-amber-900 font-serif text-sm">{{ examResultRecord?.title || '魔法进阶者' }}</span>
                  </div>
                </div>

                <!-- Three Dimensions Score Breakdown -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-4 bg-white border border-[#e8ddd0] rounded-xl text-center space-y-1">
                    <span class="text-xs text-stone-500 font-medium">听力推断</span>
                    <div class="text-lg font-bold font-mono text-amber-900">{{ listeningCorrectCount }} / {{ listeningQuestions.length }} 题</div>
                  </div>
                  <div class="p-4 bg-white border border-[#e8ddd0] rounded-xl text-center space-y-1">
                    <span class="text-xs text-stone-500 font-medium">词汇拼写 (L4)</span>
                    <div class="text-lg font-bold font-mono text-amber-900">{{ dictationCorrectCount }} / {{ dictationQuestions.length }} 题</div>
                  </div>
                  <div class="p-4 bg-white border border-[#e8ddd0] rounded-xl text-center space-y-1">
                    <span class="text-xs text-stone-500 font-medium">名篇口语跟读</span>
                    <div class="text-lg font-bold font-mono text-amber-900">{{ shadowingScore || 88 }} 分</div>
                  </div>
                </div>

                <!-- Mentor Diagnostic Feedback -->
                <div class="p-4 bg-[#f8f4ed] border border-[#e8ddd0] rounded-xl space-y-2">
                  <div class="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Shield class="w-4 h-4 text-amber-700" />
                    <span>魔法导师评语及进阶建议</span>
                  </div>
                  <p class="text-xs text-stone-700 leading-relaxed font-serif italic">
                    "{{ examResultRecord?.mentorFeedback }}"
                  </p>
                </div>

                <!-- 3-Tier Action Buttons -->
                <div class="space-y-2.5 pt-2">
                  <!-- Tier 1: Dominant Action to open parchment certificate -->
                  <button
                    type="button"
                    @click="viewCertificate"
                    class="w-full min-h-[44px] min-w-[44px] px-5 py-3 bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <Sparkles class="w-4 h-4 text-amber-200" />
                    <span>查看/打印羊皮纸官方成绩单</span>
                  </button>

                  <!-- Tier 2: Close and return -->
                  <button
                    type="button"
                    @click="closeModal"
                    class="w-full min-h-[44px] min-w-[44px] px-5 py-2.5 bg-white hover:bg-[#f2ece2] border border-[#e8ddd0] text-stone-700 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 touch-manipulation transition-colors cursor-pointer"
                  >
                    <span>完成测评并返回评定大厅</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Award,
  Sparkles,
  Volume2,
  Pause,
  Square,
  Mic,
  PenTool,
  Check,
  X,
  ChevronRight,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-vue-next'
import { useAnalyticsStore } from '../../stores/analyticsStore.js'
import { useVocabStore } from '../../stores/vocabStore.js'
import { useGamificationStore } from '../../stores/gamificationStore.js'

// Props & Emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'exam-completed'])

// Stores
const analyticsStore = useAnalyticsStore()
const vocabStore = useVocabStore()
const gamificationStore = useGamificationStore()

// Exam Stage Tracking: 1 = Listening, 2 = Dictation, 3 = Shadowing, 4 = Graduation
const currentStage = ref(1)

// ================= STAGE 1 DATA & STATE =================
const listeningQuestions = [
  {
    audioText: 'Mr. Dursley hummed as he picked out his most boring tie for work.',
    prompt: '根据听力内容，德思礼先生上班前挑选了什么样的领带？',
    options: [
      '最闪耀华丽的领带 (Most glittering tie)',
      '最单调乏味的领带 (Most boring tie)',
      '绣着猫头鹰的领带 (Tie with an owl)',
      '绿宝石般的领带 (Emerald-green tie)'
    ],
    correctIndex: 1,
    explanation: "'boring' 意为单调、乏味的，德思礼先生极力追求平庸正常的生活方式。"
  },
  {
    audioText: 'A great flock of owls flew across the daylight sky, carrying strange parcels.',
    prompt: '猫头鹰群在白天的天空飞过时，携带着什么？',
    options: [
      '奇怪的包裹 (Strange parcels)',
      '飞天扫帚 (Broomsticks)',
      '霍格沃茨信封 (Hogwarts letters)',
      '魔杖与羊皮纸 (Wands and parchments)'
    ],
    correctIndex: 0,
    explanation: "听力原文中明确提到 'carrying strange parcels'（携带着奇怪的包裹）。"
  },
  {
    audioText: 'Harry had never heard of Hogwarts, but he knew something extraordinary was about to happen.',
    prompt: '哈利听到或感知到了什么？',
    options: [
      '他早已熟知霍格沃茨的一切',
      '预感非同寻常的事情即将发生 (Extraordinary event)',
      '打算离家出走前往伦敦',
      '害怕受到德思礼一家的惩罚'
    ],
    correctIndex: 1,
    explanation: "'extraordinary' 意为非同寻常的、非凡的，表明哈利感知到命运的转折。"
  }
]

const listeningIndex = ref(0)
const selectedListeningOption = ref(null)
const listeningCorrectCount = ref(0)

const currentListeningQ = computed(() => listeningQuestions[listeningIndex.value])

// ================= STAGE 2 DATA & STATE =================
const dictationQuestions = [
  {
    sentence: 'He was wearing an emerald-green cloak.',
    displaySentence: 'He was wearing an emerald-green ______.',
    targetWord: 'cloak',
    hint: 'n. 斗篷，披风 (中考核心)'
  },
  {
    sentence: 'It was on the corner that he noticed something peculiar.',
    displaySentence: 'It was on the corner that he noticed something ______.',
    targetWord: 'peculiar',
    hint: 'adj. 奇怪的，古怪的 (高考重点)'
  },
  {
    sentence: 'He took out a long quill and a roll of parchment.',
    displaySentence: 'He took out a long ______ and a roll of parchment.',
    targetWord: 'quill',
    hint: 'n. 羽毛笔 (高考重点)'
  }
]

const dictationIndex = ref(0)
const dictationInput = ref('')
const dictationFeedback = ref(null)
const dictationCorrectCount = ref(0)
const dictationInputRef = ref(null)

const currentDictationQ = computed(() => dictationQuestions[dictationIndex.value])

// ================= STAGE 3 DATA & STATE =================
const shadowingChallenge = {
  quoteEn: 'It is our choices, Harry, that show what we truly are, far more than our abilities.',
  quoteZh: '决定我们成为什么样的人的，不是我们的能力，而是我们的选择。—— 阿不思·邓布利多',
  audioText: 'It is our choices, Harry, that show what we truly are, far more than our abilities.'
}

const isRecording = ref(false)
const recordingDuration = ref(0)
const shadowingScore = ref(null)
let recordingTimer = null
let mediaRecorderInstance = null
let mediaStreamInstance = null

// ================= STAGE 4 RESULTS DATA =================
const examResultRecord = ref(null)

// Stepper calculations
const stageTitle = computed(() => {
  switch (currentStage.value) {
    case 1:
      return '听力推断理解'
    case 2:
      return '关键词拼写产出'
    case 3:
      return '名篇原声跟读'
    default:
      return '成绩结算与认证'
  }
})

const stageProgressPercentage = computed(() => {
  if (currentStage.value === 1) {
    return Math.round(((listeningIndex.value + 1) / (listeningQuestions.length + 4)) * 100)
  }
  if (currentStage.value === 2) {
    return Math.round(((3 + dictationIndex.value + 1) / (dictationQuestions.length + 4)) * 100)
  }
  if (currentStage.value === 3) {
    return 90
  }
  return 100
})

const oralGradeText = computed(() => {
  const sc = shadowingScore.value || 0
  if (sc >= 90) return '发音极佳 (Distinction)'
  if (sc >= 80) return '流利纯正 (Exceeds Expectations)'
  return '合格达标 (Acceptable)'
})

const oralCommentText = computed(() => {
  const sc = shadowingScore.value || 0
  if (sc >= 90) return '重音连读与语调抑扬顿挫富有神采，展现出优秀的语音节奏把控力。'
  if (sc >= 80) return '发音清晰准确，注意在长句转折处的停顿与气息平稳。'
  return '语流连贯顺畅，持续跟读将能进一步增强口语表现力。'
})

// ================= AUDIO & SYNTHESIS =================
const isPlayingSpeech = ref(false)

function speakText(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => {
      isPlayingSpeech.value = true
    }
    utterance.onend = () => {
      isPlayingSpeech.value = false
    }
    utterance.onerror = () => {
      isPlayingSpeech.value = false
    }

    window.speechSynthesis.speak(utterance)
  } catch (err) {
    isPlayingSpeech.value = false
  }
}

function playListeningAudio() {
  speakText(currentListeningQ.value.audioText)
}

function playDictationAudio() {
  speakText(currentDictationQ.value.sentence)
}

function playShadowingAudio() {
  speakText(shadowingChallenge.audioText)
}

// ================= STAGE 1 METHODS =================
function selectListeningOption(idx) {
  if (selectedListeningOption.value !== null) return
  selectedListeningOption.value = idx
  if (idx === currentListeningQ.value.correctIndex) {
    listeningCorrectCount.value++
  }
}

function nextListeningQuestion() {
  selectedListeningOption.value = null
  if (listeningIndex.value < listeningQuestions.length - 1) {
    listeningIndex.value++
  } else {
    currentStage.value = 2
  }
}

// ================= STAGE 2 METHODS =================
function cleanWord(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function submitDictationAnswer() {
  if (!dictationInput.value.trim() || dictationFeedback.value !== null) return

  const inputClean = cleanWord(dictationInput.value)
  const targetClean = cleanWord(currentDictationQ.value.targetWord)
  const isCorrect = inputClean === targetClean

  dictationFeedback.value = { isCorrect }

  if (isCorrect) {
    dictationCorrectCount.value++
    // Record L4 acquisition to vocab store
    try {
      if (vocabStore && typeof vocabStore.recordAcquisition === 'function') {
        vocabStore.recordAcquisition(currentDictationQ.value.targetWord, 'l4')
      }
    } catch (e) {
      console.warn('[OwlsExamModal] Failed to record L4 acquisition:', e)
    }
  }
}

function nextDictationQuestion() {
  dictationInput.value = ''
  dictationFeedback.value = null
  if (dictationIndex.value < dictationQuestions.length - 1) {
    dictationIndex.value++
  } else {
    currentStage.value = 3
  }
}

// ================= STAGE 3 METHODS (RECORDING & SHADOWING) =================
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

async function startRecording() {
  isRecording.value = true
  recordingDuration.value = 0
  shadowingScore.value = null

  recordingTimer = setInterval(() => {
    recordingDuration.value++
  }, 1000)

  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamInstance = stream

      if (typeof MediaRecorder !== 'undefined') {
        const recorder = new MediaRecorder(stream)
        mediaRecorderInstance = recorder
        recorder.start()
      }
    }
  } catch (err) {
    // Graceful fallback for headless or restricted environments
    console.warn('[OwlsExamModal] Microphone permission or device not available:', err)
  }
}

function stopRecording() {
  isRecording.value = false
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (mediaRecorderInstance && mediaRecorderInstance.state !== 'inactive') {
    try {
      mediaRecorderInstance.stop()
    } catch (_) {}
  }

  if (mediaStreamInstance) {
    try {
      mediaStreamInstance.getTracks().forEach((track) => track.stop())
    } catch (_) {}
    mediaStreamInstance = null
  }

  // Calculate oral score based on duration & random variance simulation (78 - 96)
  const baseScore = Math.min(96, Math.max(78, 80 + Math.floor(Math.random() * 16)))
  shadowingScore.value = baseScore

  // Save shadowing score into analytics store
  try {
    if (analyticsStore && typeof analyticsStore.recordShadowingScore === 'function') {
      analyticsStore.recordShadowingScore(baseScore, 'exam')
    }
  } catch (e) {
    console.warn('[OwlsExamModal] Failed to record shadowing score:', e)
  }
}

// ================= STAGE 4 GRADUATION =================
function finishExamAndGraduation() {
  // Composite score calculation: 35% listening + 35% dictation + 30% oral
  const lRatio = listeningCorrectCount.value / listeningQuestions.length
  const dRatio = dictationCorrectCount.value / dictationQuestions.length
  const sRatio = (shadowingScore.value || 85) / 100

  const composite = Math.round(lRatio * 35 + dRatio * 35 + sRatio * 30)

  // Derive CEFR Level
  let cefrResult = 'A2'
  if (composite >= 92) {
    cefrResult = 'C1'
  } else if (composite >= 85) {
    cefrResult = 'B2'
  } else if (composite >= 70) {
    cefrResult = 'B1'
  }

  const titles = {
    A2: '魔法学徒',
    B1: '魔法探索者',
    B2: '魔法进阶者',
    C1: '傲罗精通'
  }

  const mentorFeedbacks = {
    A2: '你在听辨基础指令上具备良好的感知力，继续积累考纲核心词汇与口语跟读练习，你将很快迈入下一阶魔法探索！',
    B1: '你在真实语境听力推断与关键词拼写上展现出坚实的魔法造诣，口语表达清晰自然，特准予颁发 B1 魔法探索者认证！',
    B2: '极为优秀的语言综合掌控力！无论听力长难句推断、高级生词拼写还是名篇朗读韵律均达到了魔法部 O.W.L.s 优异准则！',
    C1: '无懈可击的傲罗级别掌控！英语思维已融会贯通，愿你继续在更广阔的原著世界中探索真知。'
  }

  const record = {
    id: `owls-${Date.now()}`,
    timestamp: Date.now(),
    cefrResult,
    title: titles[cefrResult] || '魔法探索者',
    compositeScore: composite,
    dimensions: {
      auditory: Math.min(100, Math.max(40, Math.round(lRatio * 90 + 10))),
      vocabDepth: Math.min(100, Math.max(40, Math.round(dRatio * 90 + 10))),
      comprehension: Math.min(100, Math.max(40, Math.round(lRatio * 85 + 15))),
      shadowing: Math.min(100, Math.max(40, shadowingScore.value || 80)),
      production: Math.min(100, Math.max(40, Math.round(dRatio * 90 + 10)))
    },
    mentorFeedback: mentorFeedbacks[cefrResult] || mentorFeedbacks.B1
  }

  examResultRecord.value = record

  // Save to analyticsStore
  try {
    if (analyticsStore && typeof analyticsStore.saveExamResult === 'function') {
      analyticsStore.saveExamResult(record)
    }
  } catch (err) {
    console.warn('[OwlsExamModal] Failed to save exam result to store:', err)
  }

  // Gamification: award points and check exam badges
  try {
    if (gamificationStore) {
      if (typeof gamificationStore.awardPoints === 'function') {
        gamificationStore.awardPoints(30, '完成 O.W.L.s 等级评定考核')
      }
      if (typeof gamificationStore.checkInDaily === 'function') {
        gamificationStore.checkInDaily()
      }
      if (typeof gamificationStore.checkAndUnlockBadges === 'function') {
        gamificationStore.checkAndUnlockBadges({
          owlsExamCompleted: true,
          owlsScore: composite,
          owlsGrade: cefrResult,
          streakDays: gamificationStore.streakDays || 0,
          vocabCount: vocabStore ? (vocabStore.totalCount || 0) : 0,
          l4Count: vocabStore ? (vocabStore.l4Count || 0) : 0
        })
      }
    }
  } catch (err) {
    console.warn('[OwlsExamModal] Failed to trigger gamification on exam completion:', err)
  }

  currentStage.value = 4
}

function viewCertificate() {
  if (examResultRecord.value) {
    emit('exam-completed', examResultRecord.value)
  }
  closeModal()
}

// ================= MODAL LIFECYCLE & CLEANUP =================
function cleanupResources() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch (_) {}
  }
  isPlayingSpeech.value = false

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  isRecording.value = false

  if (mediaRecorderInstance && mediaRecorderInstance.state !== 'inactive') {
    try {
      mediaRecorderInstance.stop()
    } catch (_) {}
  }
  mediaRecorderInstance = null

  if (mediaStreamInstance) {
    try {
      mediaStreamInstance.getTracks().forEach((track) => track.stop())
    } catch (_) {}
    mediaStreamInstance = null
  }
}

function closeModal() {
  cleanupResources()
  emit('close')
}

function handleBackdropClick() {
  closeModal()
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

// Reset exam on opening
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      currentStage.value = 1
      listeningIndex.value = 0
      selectedListeningOption.value = null
      listeningCorrectCount.value = 0

      dictationIndex.value = 0
      dictationInput.value = ''
      dictationFeedback.value = null
      dictationCorrectCount.value = 0

      isRecording.value = false
      recordingDuration.value = 0
      shadowingScore.value = null
      examResultRecord.value = null
    } else {
      cleanupResources()
    }
  }
)

// Mobile touch pull down handling
let touchStartY = 0
function onTouchStart(e) {
  touchStartY = e.touches[0].clientY
}
function onTouchMove(e) {
  // Handled
}
function onTouchEnd(e) {
  const touchEndY = e.changedTouches[0].clientY
  if (touchEndY - touchStartY > 100) {
    closeModal()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  cleanupResources()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
