import React, { useState } from 'react';
import { X, Award, Sparkles, Copy, Check, Printer, Shield } from 'lucide-react';
import { HOUSES, OWLS_GRADES } from '../../constants/hogwartsTheme.js';
import { WaxSealBadge } from '../common/WaxSealBadge.jsx';

/**
 * OwlsCertificateModal — Official Hogwarts O.W.L.s Examination Report & Honor Parchment
 * (霍格沃茨普通巫师等级考试 · 阶段学业荣誉证书)
 * - Classical parchment typography with decorative border
 * - Authentic Hogwarts headmaster quote and wax seal stamp
 * - Strictly 100% Zero-Emoji Compliant
 */
export function OwlsCertificateModal({
  isOpen,
  onClose,
  userHouse = 'gryffindor',
  summary = {},
  vocabCount = 0
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const house = HOUSES[userHouse] || HOUSES.gryffindor;
  const listeningHours = ((summary?.totalListeningSeconds || 0) / 3600).toFixed(1);
  const completedChapters = summary?.completedChaptersCount || 0;
  const streakDays = summary?.streakDays || 0;
  const accuracy = summary?.dictationAvgAccuracy || 95;

  const handleCopyReport = () => {
    const text = `【霍格沃茨魔法学校 · O.W.L.s 学业荣誉通报】\n` +
      `所辖学院：${house.nameZh} (${house.nameEn})\n` +
      `校训信条：“${house.mottoZh}”\n` +
      `累计专注听力：${listeningHours} 小时\n` +
      `征服原著章节：${completedChapters} 篇\n` +
      `收录魔法生词：${vocabCount} 词\n` +
      `连续执杖天数：${streakDays} 天\n` +
      `O.W.L.s 综合评定：杰出级 (O - Outstanding)\n` +
      `“决定我们成为什么样的人的，不是我们的能力，而是我们的选择。” —— 校长 阿不思·邓布利多\n` +
      `（来自 Hogwarts Audio 魔法英语研习平台）`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const handlePrint = () => {
    window?.print?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="霍格沃茨 O.W.L.s 学业荣誉证书"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl border-2 border-[#dec9a5] bg-[#fbf9f5] text-[#1e1610] shadow-2xl p-6 sm:p-8 flex flex-col no-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="duo-touch-target absolute top-4 right-4 rounded-xl border border-[#e8ddd0] bg-white/90 hover:bg-stone-100 text-stone-600 hover:text-amber-950 transition-all active:scale-90 cursor-pointer z-10"
          title="关闭证书 (ESC)"
          aria-label="关闭证书"
        >
          <X size={18} />
        </button>

        {/* Certificate Parchment Inner Frame */}
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-amber-600/40 bg-gradient-to-b from-[#fffefc] via-[#fdfaf3] to-amber-50/40 relative overflow-hidden text-center">
          {/* Top Crest & Monogram */}
          <div className="flex flex-col items-center mb-4">
            <WaxSealBadge text="H" size={48} title="Hogwarts Seal of Approval" />
            <div className="mt-2 text-[10px] tracking-widest font-magical font-bold text-amber-900 uppercase">
              Hogwarts School of Witchcraft and Wizardry
            </div>
            <div className="text-[9px] text-stone-500 tracking-wider">
              霍格沃茨魔法学校 · 魔法教育部特许认证
            </div>
          </div>

          {/* Certificate Title */}
          <h2 className="text-xl sm:text-2xl font-bold font-magical text-amber-950 mb-1">
            普通巫师等级考试 (O.W.L.s) 学业荣誉通报
          </h2>
          <p className="text-[11px] text-stone-600 mb-6 font-reading">
            ORDINARY WIZARDING LEVEL ACADEMIC RECORD
          </p>

          {/* House Ribbon */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border mb-6 text-xs font-bold"
            style={{
              backgroundColor: house.bgLight,
              borderColor: house.borderColor,
              color: house.primaryColor
            }}
          >
            <Shield size={13} />
            <span>{house.nameZh} 学院 · {house.nameEn}</span>
            <span className="opacity-75 font-normal">| {house.mottoZh}</span>
          </div>

          {/* 4 Pillars Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl border border-amber-200/80 bg-white/80">
              <div className="text-[10px] text-stone-500 mb-0.5">累计魔力时长</div>
              <div className="text-xl font-bold font-mono text-amber-950">{listeningHours}h</div>
              <div className="text-[9px] text-stone-400">听力深度沉浸</div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200/80 bg-white/80">
              <div className="text-[10px] text-stone-500 mb-0.5">征服章节篇目</div>
              <div className="text-xl font-bold font-mono text-emerald-800">{completedChapters}</div>
              <div className="text-[9px] text-stone-400">原著通读凯歌</div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200/80 bg-white/80">
              <div className="text-[10px] text-stone-500 mb-0.5">掌握咒语生词</div>
              <div className="text-xl font-bold font-mono text-purple-900">{vocabCount}</div>
              <div className="text-[9px] text-stone-400">魔法宝典收录</div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200/80 bg-white/80">
              <div className="text-[10px] text-stone-500 mb-0.5">连续执杖天数</div>
              <div className="text-xl font-bold font-mono text-orange-600">{streakDays}</div>
              <div className="text-[9px] text-stone-400">专注毅力勋章</div>
            </div>
          </div>

          {/* Evaluation Banner */}
          <div className="p-3.5 rounded-xl border border-amber-400/60 bg-amber-500/10 mb-6 flex items-center justify-center gap-3">
            <WaxSealBadge text="O" size={32} title="杰出级 (Outstanding)" />
            <div className="text-left">
              <div className="text-xs font-bold text-amber-950">
                O.W.L.s 综合研学鉴定：杰出级 (O · Outstanding)
              </div>
              <div className="text-[10px] text-stone-600">
                该学员在英语原著精听研读与魔咒辨识中展现非凡专注，予以最高嘉奖。
              </div>
            </div>
          </div>

          {/* Dumbledore Signature Quote */}
          <div className="border-t border-amber-200/80 pt-4 text-center">
            <blockquote className="text-xs italic text-stone-700 font-reading mb-2 leading-relaxed">
              “决定我们成为什么样的人的，不是我们的能力，而是我们的选择。”
            </blockquote>
            <div className="text-[11px] font-bold font-magical text-amber-900">
              阿不思·邓布利多 (Albus Dumbledore)
            </div>
            <div className="text-[9px] text-stone-500">
              霍格沃茨魔法学校校长 · 梅林爵士团一级大魔法师
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-600" />
            <span>可复制喜报文本或直接调起系统打印为 PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="duo-touch-target px-3.5 py-2 rounded-xl border border-[#dec9a5] bg-white hover:bg-amber-50 text-xs font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? '已复制荣誉通报' : '复制喜报'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="duo-btn-primary min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer size={14} />
              <span>打印/保存 PDF 证书</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwlsCertificateModal;
