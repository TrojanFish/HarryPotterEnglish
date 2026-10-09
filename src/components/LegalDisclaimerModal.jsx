import React, { useEffect } from 'react';
import { Scale, ShieldCheck, BookOpen, Mail, X } from 'lucide-react';

/**
 * LegalDisclaimerModal — 霍格沃茨研学公约与法律声明
 * 严格遵循：
 * 1. 学术研究与非商业研学声明 (Academic Fair Use)
 * 2. 知识产权与商标致谢 (J.K. Rowling & Warner Bros. Intellectual Property)
 * 3. 青少年隐私保护与 COPPA 合规 (Adolescent Privacy & COPPA Compliance)
 * 4. 权利人快速联络与 DMCA 处置通道 (DMCA Takedown Contact)
 * 5. Apple HIG 触控人机工效 (>=44px) 与零 Unicode Emoji 规范
 */
export function LegalDisclaimerModal({ isOpen, onClose, isParchment = true }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] shadow-2xl overflow-hidden pb-safe animate-scaleUp"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* ── Top Bar (Unified 56px Apple HIG) ───────────────────────── */}
        <div className="h-14 px-5 border-b border-[#e8ddd0] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-300/80 flex items-center justify-center text-amber-800 shrink-0">
              <Scale size={18} />
            </div>
            <div>
              <h2 id="legal-modal-title" className="font-magical font-bold text-sm sm:text-base text-amber-950 truncate">
                霍格沃茨研学公约与法律声明
              </h2>
              <p className="text-[10px] text-stone-500 font-reading">
                Academic Research Charter & Legal Disclaimers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
            aria-label="关闭法律声明"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable Body ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm leading-relaxed text-stone-700 font-reading">
          {/* Section 1: Academic Fair Use */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8ddd0] space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <BookOpen size={16} className="text-amber-700 shrink-0" />
              <span>一、学术研究与非商业研学声明 (Fair Use)</span>
            </div>
            <p className="text-stone-600">
              本平台（Hogwarts Audio）系针对英语二语习得（Second Language Acquisition, SLA）与语音意识培养之非商业纯学术研究、个人学习实验项目。依据国际公认的合理使用（Fair Use）准则与我国著作权法关于课堂教学及科学研究之合理使用规定，平台所载原版原声及文字仅供学习者个人开展精听跟读、双语对照研读及难词复习。
            </p>
            <p className="text-stone-600 font-bold">
              本平台不设任何付费通道、不植入任何商业推广、严禁任何第三方以商业牟利为目的转售或分发本研习工具。
            </p>
          </div>

          {/* Section 2: Intellectual Property */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8ddd0] space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <Scale size={16} className="text-amber-700 shrink-0" />
              <span>二、著作权人致敬与商标致谢 (Intellectual Property)</span>
            </div>
            <p className="text-stone-600">
              “Harry Potter”系列小说世界观、角色设定、魔法专有名词、原版出版文本及演播音频之完整著作权与注册商标，均归属于原作者 <span className="font-bold text-stone-900">J.K. Rowling</span> 与华纳兄弟娱乐公司（<span className="font-bold text-stone-900">Warner Bros. Entertainment Inc.</span>）所有。
            </p>
            <p className="text-stone-600">
              我们向 J.K. Rowling 女士及创造这一不朽魔法宇宙的所有艺术家致以崇高敬意。本平台为独立技术研习平台，与原作者及华纳兄弟等商业权利实体无直接商业从属或商业代理关系。
            </p>
          </div>

          {/* Section 3: COPPA & Adolescent Privacy */}
          <div className="p-4 rounded-2xl bg-white border border-[#e8ddd0] space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>三、青少年隐私保护与 COPPA 合规 (Adolescent Privacy)</span>
            </div>
            <p className="text-stone-600">
              本平台面向包括 11–15 岁青少年在内的英语听说学习者，全面遵循《儿童在线隐私保护法》（COPPA）及青少年个人信息保护基线：
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
              <li><span className="font-bold">零个人信息收集（Zero PII）</span>：平台绝不索取、不存储、不外传学习者真实姓名、手机号、地理位置或生物识别特征。</li>
              <li><span className="font-bold">离线优先持久化</span>：生词本、听力时长、跟读录音完全保存在学习者本地设备（IndexedDB / LocalStorage）。</li>
              <li><span className="font-bold">匿名通行漫游</span>：多设备数据同步仅使用 6 位随机生成的通行码（如 HP-XXXX），不挂钩任何外部社交或身份账号。</li>
            </ul>
          </div>

          {/* Section 4: DMCA Takedown Channel */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <Mail size={16} className="text-amber-800 shrink-0" />
              <span>四、权利人联络与侵权处置通道 (DMCA Takedown)</span>
            </div>
            <p className="text-stone-700">
              我们深切尊重所有知识产权权利人的合法权益。若版权方认为平台对相关材料之引用超出非商业学术研学合理使用范畴，或有任何修改/下架建议，欢迎随时通过专属联络邮箱与我们取得联系：
            </p>
            <div className="p-2.5 rounded-xl bg-white border border-amber-200 font-mono text-xs text-amber-900 font-bold select-all flex items-center justify-between">
              <span>feedback@hogwarts-audio.internal</span>
              <a
                href="mailto:feedback@hogwarts-audio.internal"
                className="text-amber-700 underline hover:text-amber-900 font-sans text-xs"
              >
                发送邮件
              </a>
            </div>
            <p className="text-[11px] text-stone-500">
              我们承诺在收到有效权利人通知并核验后的 24 小时内迅速落实修正、暂停访问或彻底删除。
            </p>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-[#e8ddd0] bg-stone-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400 font-reading">
            版本: v1.0.0-prod · 学术研学协议
          </span>
          <button
            type="button"
            onClick={onClose}
            className="duo-btn-primary min-h-[44px] px-5 text-xs font-bold"
          >
            我已阅读并了解
          </button>
        </div>
      </div>
    </div>
  );
}

export default LegalDisclaimerModal;
