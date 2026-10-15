<template>
  <!-- Full layout: 4 labeled badge cards in a responsive grid -->
  <div
    v-if="size === 'full'"
    role="group"
    :aria-label="ariaSummary"
    class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
  >
    <component
      :is="interactive ? 'button' : 'div'"
      v-for="stage in stages"
      :key="stage.key"
      :type="interactive ? 'button' : undefined"
      :aria-label="`${stage.label}: ${stage.isActive ? '已掌握' : '待习得'}`"
      :aria-pressed="interactive ? stage.isActive : undefined"
      :class="[
        'rounded-lg border px-3 py-2 flex items-center justify-between transition-all select-none',
        interactive ? 'min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-95 active:scale-[0.98]' : '',
        stage.isActive ? stage.activeClass : inactiveClass
      ]"
      @click="handleSelect(stage.key)"
    >
      <div class="flex items-center gap-2">
        <component :is="stage.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
        <div class="text-left">
          <div class="text-xs font-bold tracking-wide">
            {{ stage.key.toUpperCase() }} {{ stage.char }}
          </div>
          <div class="text-[10px] opacity-80 leading-tight">
            {{ stage.desc }}
          </div>
        </div>
      </div>
      <span class="text-[10px] font-medium ml-1.5 px-1.5 py-0.5 rounded bg-black/10">
        {{ stage.isActive ? '已达标' : '未解锁' }}
      </span>
    </component>
  </div>

  <!-- Compact layout: mini pill bar with 4 segments -->
  <div
    v-else
    role="group"
    :aria-label="ariaSummary"
    class="inline-flex items-center gap-1"
  >
    <component
      :is="interactive ? 'button' : 'div'"
      v-for="stage in stages"
      :key="stage.key"
      :type="interactive ? 'button' : undefined"
      :aria-label="`${stage.label}: ${stage.isActive ? '已掌握' : '待习得'}`"
      :aria-pressed="interactive ? stage.isActive : undefined"
      :class="[
        'inline-flex items-center gap-1 rounded text-xs font-medium border transition-colors select-none',
        interactive ? 'min-h-[44px] min-w-[44px] justify-center px-2 py-1 cursor-pointer hover:opacity-95 active:scale-[0.98]' : 'px-1.5 py-0.5',
        stage.isActive ? stage.activeClass : inactiveClass
      ]"
      @click="handleSelect(stage.key)"
    >
      <component :is="stage.icon" :class="[interactive ? 'w-3.5 h-3.5' : 'w-3 h-3', 'shrink-0']" aria-hidden="true" />
      <span class="font-bold">{{ stage.char }}</span>
    </component>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Volume2, BookOpen, Brain, PenTool } from 'lucide-vue-next'

const props = defineProps({
  acquisition: {
    type: Object,
    default: () => ({ l1: false, l2: false, l3: false, l4: false })
  },
  size: {
    type: String,
    default: 'compact',
    validator: (v) => ['compact', 'full'].includes(v)
  },
  interactive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-level'])

const inactiveClass = 'bg-[#f0ebe1] text-[#a89f91] border-[#e2d9cc]'

const stages = computed(() => {
  const acq = props.acquisition || {}
  return [
    {
      key: 'l1',
      char: '识',
      label: 'L1 识',
      desc: '听音辨词',
      icon: Volume2,
      isActive: Boolean(acq.l1),
      activeClass: 'bg-amber-400 text-amber-950 border-amber-500'
    },
    {
      key: 'l2',
      char: '懂',
      label: 'L2 懂',
      desc: '原著知意',
      icon: BookOpen,
      isActive: Boolean(acq.l2),
      activeClass: 'bg-amber-500 text-white border-amber-600'
    },
    {
      key: 'l3',
      char: '忆',
      label: 'L3 忆',
      desc: '间隔提取',
      icon: Brain,
      isActive: Boolean(acq.l3),
      activeClass: 'bg-amber-600 text-white border-amber-700'
    },
    {
      key: 'l4',
      char: '用',
      label: 'L4 用',
      desc: '产出应用',
      icon: PenTool,
      isActive: Boolean(acq.l4),
      activeClass: 'bg-emerald-600 text-white border-emerald-700'
    }
  ]
})

const ariaSummary = computed(() => {
  const acq = props.acquisition || {}
  return `词汇习得深度: L1识(${acq.l1 ? '已掌握' : '待习得'}), L2懂(${acq.l2 ? '已掌握' : '待习得'}), L3忆(${acq.l3 ? '已掌握' : '待习得'}), L4用(${acq.l4 ? '已掌握' : '待习得'})`
})

function handleSelect(levelKey) {
  if (props.interactive) {
    emit('select-level', levelKey)
  }
}
</script>
