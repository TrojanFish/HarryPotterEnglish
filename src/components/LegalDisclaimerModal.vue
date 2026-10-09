<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        @click="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <div
          @click.stop
          class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] shadow-2xl overflow-hidden"
        >
          <!-- Mobile Drag Indicator -->
          <div class="sm:hidden w-12 h-1 bg-[#d8cec2] rounded-full mx-auto my-2.5 shrink-0" />

          <!-- Header (Apple HIG >= 44px) -->
          <div class="h-14 px-5 border-b border-[#e8ddd0] bg-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706] shrink-0">
                <Scale class="w-4 h-4" />
              </div>
              <div>
                <h2 id="legal-modal-title" class="font-serif font-bold text-sm sm:text-base text-[#1e1610] truncate">
                  霍格沃茨研学公约与法律声明
                </h2>
                <p class="text-[10px] text-[#78695d] font-mono">
                  Academic Research Charter & Legal Disclaimers
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#78695d] hover:text-[#1e1610] hover:bg-[#f4ebe1] active:scale-95 transition-all"
              aria-label="关闭法律声明"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-[#4a3b32]">
            <!-- Section 1: Academic Fair Use -->
            <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] space-y-2">
              <div class="flex items-center gap-2 font-bold text-[#1e1610] text-sm">
                <BookOpen class="w-4 h-4 text-[#d97706] shrink-0" />
                <span>一、学术研究与非商业研学声明 (Fair Use)</span>
              </div>
              <p class="text-[#5c4d42]">
                本平台（Hogwarts Audio）系针对英语二语习得（Second Language Acquisition, SLA）与语音意识培养之非商业纯学术研究、个人学习实验项目。依据国际公认的合理使用（Fair Use）准则与相关著作权法律法规之合理使用规定，平台所载原版原声及文字仅供学习者个人开展精听跟读、双语对照研读及难词复习。
              </p>
              <p class="text-[#5c4d42] font-semibold">
                本平台不设任何付费通道、不植入任何商业推广、严禁任何第三方以商业牟利为目的转售或分发本研习工具。
              </p>
            </div>

            <!-- Section 2: Intellectual Property -->
            <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] space-y-2">
              <div class="flex items-center gap-2 font-bold text-[#1e1610] text-sm">
                <Scale class="w-4 h-4 text-[#d97706] shrink-0" />
                <span>二、著作权人致敬与商标致谢 (Intellectual Property)</span>
              </div>
              <p class="text-[#5c4d42]">
                “Harry Potter”系列小说世界观、角色设定、魔法专有名词、原版出版文本及演播音频之完整著作权与注册商标，均归属于原作者 <span class="font-bold text-[#1e1610]">J.K. Rowling</span> 与华纳兄弟娱乐公司（<span class="font-bold text-[#1e1610]">Warner Bros. Entertainment Inc.</span>）所有。
              </p>
              <p class="text-[#5c4d42]">
                我们向原作者及创造这一经典作品的所有艺术家致以崇高敬意。本平台为独立技术研习项目，与原作者及华纳兄弟等商业权利实体无商业从属关系。
              </p>
            </div>

            <!-- Section 3: COPPA & Adolescent Privacy -->
            <div class="p-4 rounded-xl bg-white border border-[#e8ddd0] space-y-2">
              <div class="flex items-center gap-2 font-bold text-[#1e1610] text-sm">
                <ShieldCheck class="w-4 h-4 text-emerald-700 shrink-0" />
                <span>三、青少年隐私保护与 COPPA 合规 (Adolescent Privacy)</span>
              </div>
              <p class="text-[#5c4d42]">
                本平台面向青少年在内的英语听说学习者，全面遵循《儿童在线隐私保护法》（COPPA）及青少年个人信息保护基线：
              </p>
              <ul class="list-disc list-inside space-y-1 text-[#5c4d42] pl-1 text-xs">
                <li><span class="font-semibold text-[#1e1610]">零个人隐私收集（Zero PII）</span>：平台绝不索取、不存储、不上传学习者真实姓名、联系方式或生物识别数据。</li>
                <li><span class="font-semibold text-[#1e1610]">本地优先持久化</span>：生词本、听力时长、跟读录音完全保存在学习者本地设备（IndexedDB / LocalStorage）。</li>
                <li><span class="font-semibold text-[#1e1610]">设备完全隔离</span>：录音音频仅在浏览器本地内存处理与临时回放，不流经任何外部云端中转服务器。</li>
              </ul>
            </div>

            <!-- Section 4: DMCA Takedown Channel -->
            <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div class="flex items-center gap-2 font-bold text-[#1e1610] text-sm">
                <Mail class="w-4 h-4 text-[#d97706] shrink-0" />
                <span>四、权利人联络与侵权处置通道 (DMCA Takedown)</span>
              </div>
              <p class="text-[#5c4d42]">
                我们深切尊重所有知识产权权利人的合法权益。若版权方认为平台对相关材料之引用超出非商业学术研学合理使用范畴，或有任何修改/下架建议，欢迎随时通过专属联络邮箱与我们取得联系：
              </p>
              <div class="p-2.5 rounded-lg bg-white border border-amber-200 font-mono text-xs text-[#854d0e] font-bold select-all flex items-center justify-between">
                <span>feedback@hogwarts-audio.internal</span>
                <a
                  href="mailto:feedback@hogwarts-audio.internal"
                  class="text-[#d97706] underline hover:text-[#b45309] font-sans text-xs"
                >
                  发送邮件
                </a>
              </div>
              <p class="text-[11px] text-[#78695d]">
                我们承诺在收到有效权利人通知并核验后的 24 小时内迅速落实修正、暂停访问或彻底删除。
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t border-[#e8ddd0] bg-[#f4ebe1]/60 flex items-center justify-between shrink-0">
            <span class="text-[11px] text-[#78695d] font-mono">
              版本: v1.0.0-prod · 学术研学协议
            </span>
            <button
              type="button"
              @click="$emit('close')"
              class="min-h-[44px] px-5 py-2 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              已阅并同意
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Scale, BookOpen, ShieldCheck, Mail, X } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])
</script>
