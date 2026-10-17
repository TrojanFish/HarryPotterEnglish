import {
  Headphones,
  Video,
  Library,
  Bookmark,
  Award,
  BarChart2,
  HardDrive
} from 'lucide-vue-next'

/**
 * Centralized Study Modules Registry.
 * Decouples module registration from UI layout components.
 * Adding a module here automatically configures navigation across Desktop, Tablet, and Mobile.
 */
export const STUDY_MODULES = [
  {
    id: 'player_reader',
    label: '原著精听',
    title: '原著精听',
    desc: '逐句同步双语伴读',
    icon: Headphones,
    view: 'player',
    group: 'workshop',
    studyMode: 'normal'
  },
  {
    id: 'ted',
    label: 'TED演讲',
    title: 'TED演讲',
    desc: '双语演讲与名家视界',
    icon: Video,
    view: 'ted',
    group: 'workshop'
  },
  {
    id: 'bookshelf',
    label: '魔法书架',
    title: '魔法书架',
    desc: '原著书库与章节精选',
    icon: Library,
    view: 'bookshelf',
    group: 'workshop'
  },
  {
    id: 'vocab',
    label: '生词本',
    title: '生词本',
    desc: '难词收藏与复习',
    icon: Bookmark,
    view: 'vocab',
    group: 'tools'
  },
  {
    id: 'assessment',
    label: '能力评定',
    title: '能力评定',
    desc: 'CEFR定级与巫师等级考',
    icon: Award,
    view: 'assessment',
    group: 'tools'
  },
  {
    id: 'analytics',
    label: '学业罗盘',
    title: '学业罗盘',
    desc: '连续打卡与学情趋势',
    icon: BarChart2,
    view: 'analytics',
    group: 'tools'
  },
  {
    id: 'storage',
    label: '离线管理',
    title: '离线管理',
    desc: '离线缓存与存储占用',
    icon: HardDrive,
    view: 'storage',
    group: 'tools'
  }
]

export const WORKSHOP_MODULES = STUDY_MODULES.filter((m) => m.group === 'workshop')
export const TOOL_MODULES = STUDY_MODULES.filter((m) => m.group === 'tools')
