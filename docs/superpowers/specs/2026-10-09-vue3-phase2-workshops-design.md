# Hogwarts Audio Vue 3 渐进式重构技术规格书 (Phase 2: 影子跟读与拼写听写工坊)

- **作者/制定者**: Antigravity AI & Hogwarts Audio 团队
- **制定日期**: 2026-10-09
- **状态**: Approved / Ready for Implementation
- **目标分支**: `feature/vue3-core-mvp`

---

## 1. 目标与范围

在 Phase 1（核心音频播放与 WebVTT 英雄聚焦字幕）成功落地的基础上，Phase 2 迁移两大核心口语与听写交互工坊：
1. **A/B 影子跟读工坊 (`ShadowingRecorder.vue`)**：
   - 采集麦克风输入与 Web Speech API 实时转写；
   - 复用 `src/utils/speechScoring.js`，输出 0~100% 客观发音评分与词级三色高亮（绿/黄/红）；
   - Track A（原声切片）与 Track B（学生录音）双轨并列对比回放；
   - 麦克风硬件资源安全回收机制。
2. **拼写听写工坊 (`DictationStudio.vue`)**：
   - 单句原声重听与 0.8x 慢放磨耳朵；
   - 16px `text-base` 移动端防 iOS Safari 聚焦强制缩放；
   - 实时拼写对比、羽毛笔提示与双通道正误提示；
   - 错词识别与标记。
3. **顶层容器组装 (`App.vue`)**：
   - 将顶栏跟读与听写按钮从占位弹窗升级为真实工坊交互。

---

## 2. 交互与质量规范

1. **零 Emoji 规范**：界面严禁使用任何表情符号，所有图标使用 `lucide-vue-next`；
2. **人机工程学基准**：工坊内操作按钮热区必须 $\ge 44 \times 44\text{px}$；
3. **硬件资源生命周期管理**：在模态窗关闭或组件卸载时，强制调用 `stream.getTracks().forEach(t => t.stop())`，保证麦克风占用指示灯立即熄灭。
