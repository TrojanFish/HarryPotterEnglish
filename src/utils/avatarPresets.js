import {
  User,
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
  Shield
} from 'lucide-vue-next'

export const AVATAR_PRESETS = [
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

export function getAvatarPreset(avatarId) {
  if (!avatarId || avatarId === 'default') return AVATAR_PRESETS[0]
  const match = AVATAR_PRESETS.find(p => p.id === avatarId)
  return match || AVATAR_PRESETS[0]
}

export function getAvatarIcon(avatarId) {
  return getAvatarPreset(avatarId).icon
}
