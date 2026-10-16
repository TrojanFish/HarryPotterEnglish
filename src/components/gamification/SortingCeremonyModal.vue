<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style="padding-top: max(1rem, env(safe-area-inset-top, 0px)); padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));"
    >
      <!-- Backdrop with blur -->
      <div
        class="fixed inset-0 bg-stone-900/65 backdrop-blur-sm transition-opacity"
        @click="closeModal"
        aria-hidden="true"
      />

      <!-- Modal Dialog Window -->
      <div
        role="dialog"
        aria-modal="true"
        aria-label="分院帽仪式"
        class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#fbf9f5] border-2 border-[#e8ddd0] rounded-2xl sm:rounded-3xl shadow-2xl text-[#1c1917] p-4 sm:p-7 flex flex-col z-10 transition-all focus:outline-none"
        tabindex="-1"
      >
        <!-- Modal Top Bar: Badge & Close Button -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#e8ddd0]/80">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shadow-xs">
              <GraduationCap class="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 class="text-lg sm:text-xl font-bold font-serif tracking-wide text-stone-900 flex items-center gap-2">
                霍格沃茨分院仪式
                <Sparkles class="w-4 h-4 text-amber-600" />
              </h2>
              <p class="text-xs text-stone-600 font-sans">
                戴上古老的分院帽，寻觅属于你的巫师学院
              </p>
            </div>
          </div>

          <!-- Close Button with Apple HIG min 44x44px touch target -->
          <button
            type="button"
            @click="closeModal"
            aria-label="关闭分院帽仪式"
            class="min-h-[44px] min-w-[44px] p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 flex items-center justify-center transition-all touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X class="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        <!-- Mode Toggle Tabs (Personality Quiz vs Direct Selection) -->
        <div v-if="currentMode !== 'result'" class="pt-4 pb-2">
          <div class="flex p-1 bg-stone-200/70 rounded-xl border border-stone-300/60" role="tablist" aria-label="分院模式选择">
            <button
              type="button"
              role="tab"
              :aria-selected="currentMode === 'quiz'"
              @click="switchMode('quiz')"
              aria-label="分院帽测验模式"
              class="flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation flex items-center justify-center gap-2"
              :class="currentMode === 'quiz' ? 'bg-[#fbf9f5] text-stone-900 shadow-sm border border-stone-300/80' : 'text-stone-600 hover:text-stone-900'"
            >
              <Compass class="w-4 h-4 text-amber-700" />
              分院帽测验
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="currentMode === 'direct'"
              @click="switchMode('direct')"
              aria-label="自主选院模式"
              class="flex-1 min-h-[44px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation flex items-center justify-center gap-2"
              :class="currentMode === 'direct' ? 'bg-[#fbf9f5] text-stone-900 shadow-sm border border-stone-300/80' : 'text-stone-600 hover:text-stone-900'"
            >
              <Crown class="w-4 h-4 text-amber-700" />
              自主选院
            </button>
          </div>
        </div>

        <!-- MODE 1: Personality Quiz Mode -->
        <div v-if="currentMode === 'quiz'" class="flex-1 flex flex-col pt-3">
          <!-- Stepper Indicator -->
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-stone-600 tracking-wider">
              第 {{ currentQuestionIndex + 1 }} / {{ QUIZ_QUESTIONS.length }} 题
            </span>
            <span class="text-xs font-medium text-amber-800">
              分院帽性格测验
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-5">
            <div
              class="h-full bg-amber-600 transition-all duration-300 rounded-full"
              :style="{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }"
            />
          </div>

          <!-- Current Question Header -->
          <div class="mb-4">
            <h3 class="text-base sm:text-lg font-bold font-serif text-stone-900 leading-snug">
              {{ currentQuestion.title }}
            </h3>
            <p class="text-xs text-stone-600 mt-1">
              {{ currentQuestion.subtitle }}
            </p>
          </div>

          <!-- 4 Options for Current Question -->
          <div class="space-y-2.5 sm:space-y-3 flex-1">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              type="button"
              @click="handleSelectOption(option.house)"
              :aria-label="`选项 ${String.fromCharCode(65 + index)}: ${option.label}`"
              class="w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all touch-manipulation flex items-start gap-3 active:scale-[0.99] min-h-[44px]"
              :class="userAnswers[currentQuestionIndex] === option.house
                ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-1 ring-amber-500/20'
                : 'border-[#e8ddd0] bg-white/70 hover:bg-stone-50 hover:border-amber-400'"
            >
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5"
                :class="userAnswers[currentQuestionIndex] === option.house
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-stone-400 text-stone-600 bg-stone-100'"
              >
                {{ String.fromCharCode(65 + index) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-900 leading-relaxed">
                  {{ option.label }}
                </p>
                <span class="inline-block mt-1 text-[11px] font-medium text-amber-900/80 bg-amber-100/60 px-2 py-0.5 rounded">
                  蕴含特质：{{ option.trait }}
                </span>
              </div>
            </button>
          </div>

          <!-- Stepper Navigation Buttons -->
          <div class="flex items-center justify-between pt-5 mt-2 border-t border-[#e8ddd0]/60">
            <button
              type="button"
              @click="prevQuestion"
              :disabled="currentQuestionIndex === 0"
              aria-label="返回上一题"
              class="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-all touch-manipulation active:scale-95 flex items-center gap-1.5"
            >
              上一题
            </button>

            <button
              v-if="currentQuestionIndex < QUIZ_QUESTIONS.length - 1"
              type="button"
              @click="nextQuestion"
              :disabled="!userAnswers[currentQuestionIndex]"
              aria-label="进入下一题"
              class="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl bg-amber-700 text-white text-xs sm:text-sm font-semibold hover:bg-amber-800 disabled:opacity-40 disabled:pointer-events-none transition-all touch-manipulation active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              下一题
              <ChevronRight class="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              v-else
              type="button"
              @click="finishQuiz"
              :disabled="!userAnswers[currentQuestionIndex]"
              aria-label="查看分院判定结果"
              class="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl bg-amber-800 text-white text-xs sm:text-sm font-bold hover:bg-amber-900 disabled:opacity-40 disabled:pointer-events-none transition-all touch-manipulation active:scale-95 flex items-center gap-2 shadow-md ring-2 ring-amber-400/30"
            >
              <Sparkles class="w-4 h-4" />
              查看分院推荐
            </button>
          </div>
        </div>

        <!-- MODE 2: Direct House Selection Mode -->
        <div v-else-if="currentMode === 'direct'" class="flex-1 flex flex-col pt-3">
          <div class="mb-4">
            <h3 class="text-base sm:text-lg font-bold font-serif text-stone-900 leading-snug">
              遵从本心，自选所属学院
            </h3>
            <p class="text-xs text-stone-600 mt-1">
              正如邓布利多所言：“决定我们成为什么样的人的，不是我们的能力，而是我们的选择。”
            </p>
          </div>

          <!-- 4 House Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div
              v-for="house in HOUSE_LIST"
              :key="house.id"
              role="button"
              tabindex="0"
              :aria-pressed="selectedHouseId === house.id"
              :aria-label="`选择${house.name}`"
              @click="handleDirectSelect(house.id)"
              @keydown.enter="handleDirectSelect(house.id)"
              @keydown.space.prevent="handleDirectSelect(house.id)"
              class="relative p-4 rounded-2xl border-2 cursor-pointer transition-all touch-manipulation active:scale-[0.98] min-h-[44px] flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-500"
              :class="selectedHouseId === house.id
                ? `${house.borderClass} ${house.bgClass} ring-2 ring-amber-400/40 shadow-sm`
                : 'border-[#e8ddd0] bg-white/70 hover:border-amber-400 hover:bg-white'"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs"
                      :class="house.iconBoxClass"
                    >
                      <component :is="house.crestIcon" class="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 class="font-serif font-bold text-base text-stone-900 leading-none">
                        {{ house.name }}
                      </h4>
                      <span class="text-xs text-stone-500 font-serif">
                        {{ house.enName }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="selectedHouseId === house.id"
                    class="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center"
                  >
                    <Check class="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                <p class="text-xs font-medium text-stone-700 mt-2">
                  核心品质：{{ house.qualities }}
                </p>

                <p class="text-[11px] text-stone-500 italic mt-2 line-clamp-2 leading-relaxed">
                  “{{ house.quote }}”
                </p>
              </div>

              <div class="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span class="text-[11px] text-stone-500">
                  象征宝石：{{ house.gemName }}
                </span>
                <span
                  class="font-semibold text-xs"
                  :class="selectedHouseId === house.id ? 'text-amber-800' : 'text-stone-400'"
                >
                  {{ selectedHouseId === house.id ? '已选中' : '点击选择' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Direct Mode Confirmation Button -->
          <div class="pt-5 mt-2 border-t border-[#e8ddd0]/60 flex justify-end">
            <button
              type="button"
              @click="proceedToResult"
              :disabled="!selectedHouseId"
              aria-label="确认学院选择"
              class="min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl bg-amber-800 text-white text-xs sm:text-sm font-bold hover:bg-amber-900 disabled:opacity-40 disabled:pointer-events-none transition-all touch-manipulation active:scale-95 flex items-center gap-2 shadow-md"
            >
              <span>查看学院入席决议</span>
              <ChevronRight class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- MODE 3: Confirmation & Result Screen -->
        <div v-else-if="currentMode === 'result'" class="flex-1 flex flex-col pt-3">
          <div class="text-center pb-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles class="w-3.5 h-3.5 text-amber-700" />
              分院帽庄严决议
            </span>
            <h3 class="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-2">
              属于你的学院是：{{ chosenHouse.name }}！
            </h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto">
              分院帽看透了你的品格与追求，{{ chosenHouse.name }}长桌上的学长学姐正翘首以盼你的加入。
            </p>
          </div>

          <!-- Big Celebratory House Card -->
          <div
            class="p-5 sm:p-6 rounded-2xl border-2 relative overflow-hidden my-2 shadow-md"
            :class="[chosenHouse.borderClass, chosenHouse.bgClass]"
          >
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <!-- Crest Icon -->
              <div
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 shadow-sm flex-shrink-0"
                :class="chosenHouse.iconBoxClass"
              >
                <component :is="chosenHouse.crestIcon" class="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
              </div>

              <!-- House Information -->
              <div class="flex-1 text-center sm:text-left">
                <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 justify-center sm:justify-start">
                  <h4 class="text-2xl font-bold font-serif text-stone-900">
                    {{ chosenHouse.name }}
                  </h4>
                  <span class="text-sm font-serif font-medium text-stone-500">
                    {{ chosenHouse.enName }}
                  </span>
                </div>

                <div class="mt-2 text-xs text-stone-700 space-y-1">
                  <p><strong class="font-semibold text-stone-900">学院特质：</strong>{{ chosenHouse.qualities }}</p>
                  <p><strong class="font-semibold text-stone-900">学院宝石：</strong>{{ chosenHouse.gemName }}</p>
                </div>

                <p class="mt-3 text-xs italic text-stone-600 bg-white/60 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed font-serif">
                  “{{ chosenHouse.quote }}”
                </p>
              </div>
            </div>

            <!-- Initial Sorting Rewards Notice -->
            <div class="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span class="font-medium">首次入席嘉奖：<strong>+20 学院杯学分</strong></span>
              </div>
              <span class="text-amber-900 font-semibold text-[11px] bg-amber-200/70 px-2 py-0.5 rounded">
                解锁成就勋章
              </span>
            </div>
          </div>

          <!-- Bottom Actions: Re-sort and Primary Confirmation CTA -->
          <div class="pt-5 mt-3 border-t border-[#e8ddd0]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              @click="restartSorting"
              aria-label="重新测验或重新选择学院"
              class="w-full sm:w-auto min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs sm:text-sm font-medium hover:bg-stone-100 transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-1.5 order-2 sm:order-1"
            >
              <RotateCcw class="w-4 h-4" />
              重新测验
            </button>

            <!-- Primary CTA Button with Apple HIG 44px min target and Touch Manipulation -->
            <button
              type="button"
              @click="confirmSorting"
              aria-label="入席分院并开启学院杯"
              class="w-full sm:w-auto flex-1 sm:max-w-xs min-h-[44px] min-w-[44px] px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm sm:text-base font-bold transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2 shadow-lg ring-2 ring-amber-500/40 order-1 sm:order-2"
            >
              <Sparkles class="w-4 h-4" />
              入席分院并开启学院杯
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useGamificationStore, HOUSES } from '../../stores/gamificationStore.js'
import {
  GraduationCap,
  Flame,
  BookOpen,
  Heart,
  Crown,
  Sparkles,
  Check,
  ChevronRight,
  X,
  RotateCcw,
  Compass
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'sorted'])

const gamificationStore = useGamificationStore()

// State
const currentMode = ref('quiz') // 'quiz' | 'direct' | 'result'
const currentQuestionIndex = ref(0)
const userAnswers = ref({})
const selectedHouseId = ref('gryffindor')

// House List presentation data
const HOUSE_LIST = [
  {
    id: 'gryffindor',
    name: '格兰芬多',
    enName: 'Gryffindor',
    qualities: '勇气、魄力、骑士风范',
    gemName: '红宝石 (Ruby)',
    gemColor: '#991b1b',
    primaryColor: '#b91c1c',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    crestIcon: Flame,
    borderClass: 'border-red-500',
    bgClass: 'bg-red-50/60',
    iconBoxClass: 'bg-red-100 text-red-700 border-red-200',
    quote: 'Where dwell the brave at heart, their daring, nerve, and chivalry set Gryffindors apart.'
  },
  {
    id: 'ravenclaw',
    name: '拉文克劳',
    enName: 'Ravenclaw',
    qualities: '睿智、学识、敏锐洞察',
    gemName: '蓝宝石 (Sapphire)',
    gemColor: '#1e40af',
    primaryColor: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    crestIcon: BookOpen,
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50/60',
    iconBoxClass: 'bg-blue-100 text-blue-700 border-blue-200',
    quote: 'Where those of wit and learning, will always find their kind.'
  },
  {
    id: 'hufflepuff',
    name: '赫奇帕奇',
    enName: 'Hufflepuff',
    qualities: '正直、坚韧、忠诚不渝',
    gemName: '黄晶石 (Topaz)',
    gemColor: '#b45309',
    primaryColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    crestIcon: Heart,
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-50/60',
    iconBoxClass: 'bg-amber-100 text-amber-800 border-amber-200',
    quote: 'Where they are just and loyal, those patient Hufflepuffs are true and unafraid of toil.'
  },
  {
    id: 'slytherin',
    name: '斯莱特林',
    enName: 'Slytherin',
    qualities: '雄心、谋略、追求卓越',
    gemName: '祖母绿 (Emerald)',
    gemColor: '#166534',
    primaryColor: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    crestIcon: Crown,
    borderClass: 'border-emerald-600',
    bgClass: 'bg-emerald-50/60',
    iconBoxClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    quote: "Where you'll make your real friends, those cunning folk use any means to achieve their ends."
  }
]

// 4 Hogwarts personality quiz questions
const QUIZ_QUESTIONS = [
  {
    id: 1,
    title: '面对突发的黑魔法防御危机，你的第一反应是？',
    subtitle: '面对未知的危险，直觉会暴露出你灵魂最深处的品质。',
    options: [
      {
        house: 'gryffindor',
        label: '挺身而出，拔出魔杖正面迎战，坚决保护身旁的同伴。',
        trait: '勇气与魄力'
      },
      {
        house: 'ravenclaw',
        label: '迅速冷静观察，剖析敌方魔咒的破绽并寻觅最佳反制策略。',
        trait: '智慧与洞察'
      },
      {
        house: 'hufflepuff',
        label: '掩护同伴撤退至安全区域，筑起坚韧稳固的防御屏障。',
        trait: '忠诚与坚韧'
      },
      {
        house: 'slytherin',
        label: '权衡战局利弊，巧妙借助地形环境出其不意制服对手。',
        trait: '谋略与果决'
      }
    ]
  },
  {
    id: 2,
    title: '在霍格沃茨图书馆的禁书区，你最渴望探求哪种知识？',
    subtitle: '在泛黄的羊皮纸与古老封印背后，你的心智被何物吸引？',
    options: [
      {
        house: 'gryffindor',
        label: '历代英雄与传奇决斗大师的不败剑术与强大防护战技。',
        trait: '骑士风范与英勇'
      },
      {
        house: 'ravenclaw',
        label: '记载失传古代魔文与探索宇宙时空法则的奥秘手稿。',
        trait: '渊博学识与求知欲'
      },
      {
        house: 'hufflepuff',
        label: '能治愈一切创伤、滋养万物生灵的古法草药学秘本。',
        trait: '善良宽厚与勤勉'
      },
      {
        house: 'slytherin',
        label: '掌控顶级魔法威能、颠覆局势甚至改写规则的至高法则。',
        trait: '雄心抱负与远见'
      }
    ]
  },
  {
    id: 3,
    title: '如果同伴在魔药课上意外犯错面临斯内普教授严惩，你会？',
    subtitle: '在规则与同伴之间，你将如何抉择你的行事准则？',
    options: [
      {
        house: 'gryffindor',
        label: '当场站出来分担过失，坦荡承受惩罚，绝不退缩回避。',
        trait: '敢作敢当'
      },
      {
        house: 'ravenclaw',
        label: '指出药剂配比的关键误差，协助当场调试出中和溶剂化解危机。',
        trait: '精确客观'
      },
      {
        house: 'hufflepuff',
        label: '默默陪伴在同伴身边，迅速帮忙清理坩埚残渣并轻声安慰。',
        trait: '同理心与体贴'
      },
      {
        house: 'slytherin',
        label: '巧妙转移教授注意力，顺势将意外转化为展示才智的契机。',
        trait: '随机应变'
      }
    ]
  },
  {
    id: 4,
    title: '在厄里斯魔镜 (Mirror of Erised) 面前，你最渴望看到的景象是？',
    subtitle: '镜子呈现的并非容貌，而是内心最深切、最炽烈的渴求。',
    options: [
      {
        house: 'gryffindor',
        label: '自己战胜艰难险阻，成为受众人敬重与铭记的传奇英雄。',
        trait: '追求不朽荣耀'
      },
      {
        house: 'ravenclaw',
        label: '揭开魔法界未解的终极谜题，以卓越才智启迪后世。',
        trait: '追寻真理智慧'
      },
      {
        house: 'hufflepuff',
        label: '与挚友家人在温暖炉火旁长久相伴，岁月安宁祥和。',
        trait: '珍视真挚温情'
      },
      {
        house: 'slytherin',
        label: '登上魔法世界的力量与权力顶峰，统领群雄成就宏图伟业。',
        trait: '志在傲视群雄'
      }
    ]
  }
]

// Current Question object
const currentQuestion = computed(() => {
  return QUIZ_QUESTIONS[currentQuestionIndex.value] || QUIZ_QUESTIONS[0]
})

// Chosen House object for result view
const chosenHouse = computed(() => {
  const targetId = selectedHouseId.value || 'gryffindor'
  return HOUSE_LIST.find(h => h.id === targetId) || HOUSE_LIST[0]
})

// Mode switching
function switchMode(mode) {
  currentMode.value = mode
}

// Quiz handlers
function handleSelectOption(house) {
  userAnswers.value[currentQuestionIndex.value] = house
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < QUIZ_QUESTIONS.length - 1) {
    currentQuestionIndex.value++
  }
}

function computeAffinityHouse() {
  const scores = {
    gryffindor: 0,
    ravenclaw: 0,
    hufflepuff: 0,
    slytherin: 0
  }

  for (const qIdx of Object.keys(userAnswers.value)) {
    const h = userAnswers.value[qIdx]
    if (scores[h] !== undefined) {
      scores[h]++
    }
  }

  let topHouse = 'gryffindor'
  let maxScore = -1
  const priorityOrder = ['gryffindor', 'ravenclaw', 'hufflepuff', 'slytherin']

  for (const house of priorityOrder) {
    if (scores[house] > maxScore) {
      maxScore = scores[house]
      topHouse = house
    }
  }

  return topHouse
}

function finishQuiz() {
  const recommended = computeAffinityHouse()
  selectedHouseId.value = recommended
  currentMode.value = 'result'
}

// Direct select handlers
function handleDirectSelect(houseId) {
  selectedHouseId.value = houseId
}

function proceedToResult() {
  if (selectedHouseId.value) {
    currentMode.value = 'result'
  }
}

function restartSorting() {
  userAnswers.value = {}
  currentQuestionIndex.value = 0
  currentMode.value = 'quiz'
}

// Final action
function confirmSorting() {
  if (!chosenHouse.value) return
  const houseId = chosenHouse.value.id
  gamificationStore.selectHouse(houseId)
  emit('sorted', houseId)
  emit('close')
}

function closeModal() {
  emit('close')
}

// Esc key accessibility listener
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeydown)
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown)
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
