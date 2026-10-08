import React, { useState } from 'react';
import { X, Award, Sparkles, Copy, Check, Shield, Download, RefreshCw, Share2 } from 'lucide-react';
import { OWLS_GRADES } from '../../constants/hogwartsTheme.js';
import { WaxSealBadge } from '../common/WaxSealBadge.jsx';

/**
 * Canvas utility: Draws high-resolution (Retina 1080x1620) parchment certificate
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export function generateOwlsCertificateImage({ summary = {}, vocabCount = 0 } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve({ dataUrl: '', blob: null });
      return;
    }

    try {
      const listeningHours = ((summary?.totalListeningSeconds || 0) / 3600).toFixed(1);
      const completedChapters = summary?.completedChaptersCount || 0;
      const streakDays = summary?.streakDays || 0;

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1620;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ dataUrl: '', blob: null });
        return;
      }

      // 1. Parchment base fill
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1620);
      bgGrad.addColorStop(0, '#fffefb');
      bgGrad.addColorStop(0.5, '#fcf7ec');
      bgGrad.addColorStop(1, '#f7eee1');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1620);

      // 2. Vintage borders
      ctx.strokeStyle = '#c89b3c';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, 1008, 1548);

      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(52, 52, 976, 1516);
      ctx.setLineDash([]);

      // Corner decorative lines
      const drawCorner = (x, y, flipX, flipY) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flipX, flipY);
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(64, 64, 1, 1);
      drawCorner(1016, 64, -1, 1);
      drawCorner(64, 1556, 1, -1);
      drawCorner(1016, 1556, -1, -1);

      // 3. Top Crest Seal
      const sealGrad = ctx.createRadialGradient(540, 150, 5, 540, 150, 48);
      sealGrad.addColorStop(0, '#b91c1c');
      sealGrad.addColorStop(0.8, '#991b1b');
      sealGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(540, 150, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 44px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', 540, 150);

      // School Name
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 18px "Cinzel", "Georgia", serif';
      ctx.fillText('HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY', 540, 222);

      ctx.fillStyle = '#78716c';
      ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('霍格沃茨魔法学校 · 魔法教育部特许认证', 540, 248);

      // 4. Certificate Title
      ctx.fillStyle = '#291809';
      ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", serif';
      ctx.fillText('普通巫师等级考试 (O.W.L.s) 学业荣誉通报', 540, 316);

      ctx.fillStyle = '#78716c';
      ctx.font = '14px "Cinzel", "Georgia", serif';
      ctx.fillText('ORDINARY WIZARDING LEVEL ACADEMIC RECORD', 540, 348);

      // 5. Hogwarts School Ribbon
      const ribbonW = 760;
      const ribbonH = 48;
      const ribbonX = (1080 - ribbonW) / 2;
      const ribbonY = 384;
      ctx.fillStyle = '#fffbeb';
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 24);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      roundRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 24);
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('霍格沃茨魔法学校 · Hogwarts School  |  “眠龙勿扰” Draco Dormiens Nunquam Titillandus', 540, ribbonY + 25);

      // 6. 4 Pillar Statistics Cards
      const drawStatCard = (x, y, w, h, label, val, valColor, sub) => {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, x, y, w, h, 16);
        ctx.fill();
        ctx.strokeStyle = '#e8ddd0';
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, y, w, h, 16);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#78716c';
        ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(label, x + w / 2, y + 36);

        ctx.fillStyle = valColor;
        ctx.font = 'bold 36px "SF Mono", "Consolas", monospace';
        ctx.fillText(val, x + w / 2, y + 80);

        ctx.fillStyle = '#a8a29e';
        ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(sub, x + w / 2, y + 110);
      };
      drawStatCard(110, 464, 410, 130, '累计魔力时长', `${listeningHours}h`, '#78350f', '听力深度沉浸');
      drawStatCard(560, 464, 410, 130, '征服章节篇目', `${completedChapters} 篇`, '#065f46', '原著通读凯歌');
      drawStatCard(110, 614, 410, 130, '掌握咒语生词', `${vocabCount} 词`, '#581c87', '魔法宝典收录');
      drawStatCard(560, 614, 410, 130, '连续执杖天数', `${streakDays} 天`, '#c2410c', '专注毅力勋章');

      // 7. Outstanding Evaluation Banner
      const evalW = 860;
      const evalH = 150;
      const evalX = 110;
      const evalY = 774;

      const evalGrad = ctx.createLinearGradient(evalX, evalY, evalX + evalW, evalY + evalH);
      evalGrad.addColorStop(0, '#fffbeb');
      evalGrad.addColorStop(1, '#fef3c7');
      ctx.fillStyle = evalGrad;
      roundRect(ctx, evalX, evalY, evalW, evalH, 20);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      roundRect(ctx, evalX, evalY, evalW, evalH, 20);
      ctx.stroke();

      // Mini O wax seal
      const oSealGrad = ctx.createRadialGradient(evalX + 60, evalY + 75, 2, evalX + 60, evalY + 75, 34);
      oSealGrad.addColorStop(0, '#b91c1c');
      oSealGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = oSealGrad;
      ctx.beginPath();
      ctx.arc(evalX + 60, evalY + 75, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 34px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('O', evalX + 60, evalY + 75);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('O.W.L.s 综合研学鉴定：杰出级 (O · Outstanding)', evalX + 114, evalY + 54);

      ctx.fillStyle = '#78350f';
      ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('该学员在英语原著精听研读与魔咒辨识中展现非凡专注，予以最高嘉奖。', evalX + 114, evalY + 96);

      // 8. Dumbledore Quote & Signature
      ctx.strokeStyle = '#dec9a5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(160, 970);
      ctx.lineTo(920, 970);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#291809';
      ctx.font = 'italic 22px "PingFang SC", "Georgia", serif';
      ctx.fillText('“决定我们成为什么样的人的，不是我们的能力，而是我们的选择。”', 540, 1030);

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 20px "PingFang SC", "Cinzel", serif';
      ctx.fillText('—— 阿不思·邓布利多 (Albus Dumbledore)', 540, 1080);

      ctx.fillStyle = '#a8a29e';
      ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('霍格沃茨魔法学校校长 · 梅林爵士团一级大魔法师', 540, 1115);

      // 9. Watermark Footer
      ctx.strokeStyle = '#dec9a5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(240, 1420);
      ctx.lineTo(840, 1420);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#a8a29e';
      ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif';
      const todayStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillText(`官方鉴定存档日期：${todayStr}`, 540, 1460);
      ctx.fillText('Hogwarts Audio 魔法英语研习平台 · 原版双轨沉浸研学', 540, 1490);

      // Export Blob and DataUrl
      canvas.toBlob((blob) => {
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, blob });
      }, 'image/png');
    } catch {
      resolve({ dataUrl: '', blob: null });
    }
  });
}

/**
 * OwlsCertificateModal — Official Hogwarts O.W.L.s Examination Report & Honor Parchment
 * (霍格沃茨普通巫师等级考试 · 阶段学业荣誉证书)
 * - Classical parchment typography with decorative border
 * - Authentic Hogwarts headmaster quote and wax seal stamp
 * - High-res image export (Canvas PNG) for effortless mobile saving & PC download
 * - Strictly 100% Zero-Emoji Compliant
 */
export function OwlsCertificateModal({
  isOpen,
  onClose,
  summary = {},
  vocabCount = 0
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState(null);
  const [exportedBlob, setExportedBlob] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!isOpen) return null;

  const listeningHours = ((summary?.totalListeningSeconds || 0) / 3600).toFixed(1);
  const completedChapters = summary?.completedChaptersCount || 0;
  const streakDays = summary?.streakDays || 0;

  const handleCopyReport = () => {
    const text = `【霍格沃茨魔法学校 · O.W.L.s 学业荣誉通报】\n` +
      `校训信条：“眠龙勿扰” (Draco Dormiens Nunquam Titillandus)\n` +
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

  const handleExportImage = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { dataUrl, blob } = await generateOwlsCertificateImage({
        summary,
        vocabCount
      });

      if (!dataUrl) {
        setIsExporting(false);
        return;
      }

      setExportedImageUrl(dataUrl);
      setExportedBlob(blob);

      // On mobile viewports or touch devices, open the preview sheet so users can long-press to save
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 640 || 'ontouchstart' in window);

      if (isMobile) {
        setShowPreviewModal(true);
      } else {
        // Direct browser file download on desktop
        const link = document.createElement('a');
        link.download = 'Hogwarts_OWLS_学业荣誉长图.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // Fallback
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!exportedBlob || typeof navigator === 'undefined' || !navigator.share) return;
    try {
      const file = new File([exportedBlob], 'Hogwarts_OWLS_Certificate.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '霍格沃茨 O.W.L.s 学业荣誉通报',
          text: `我在霍格沃茨魔法学校研学中荣获 O.W.L.s 杰出级荣誉！`
        });
      }
    } catch {
      // User cancelled or share unhandled
    }
  };

  const handleDownloadSavedImage = () => {
    if (!exportedImageUrl) return;
    const link = document.createElement('a');
    link.download = 'Hogwarts_OWLS_学业荣誉长图.png';
    link.href = exportedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="霍格沃茨 O.W.L.s 学业荣誉证书"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] p-5 sm:p-7 flex flex-col no-scrollbar pb-safe"
        >
          {/* Mobile Pull Handle Indicator (Apple HIG standard) */}
          <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

          {/* Standard Modal Header Bar */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e8ddd0] shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
                <Award size={20} className="text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-magical font-bold text-lg sm:text-xl text-amber-950 flex items-center gap-2 truncate">
                  <span>学业荣誉通报</span>
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold shrink-0">
                    O.W.L.s 证书
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 truncate">
                  普通巫师等级考试研学鉴定 · 支持一键复制与导出高清长图
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-amber-950 transition-all active:scale-95 cursor-pointer shrink-0"
                title="关闭 (ESC)"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Certificate Parchment Inner Frame */}
          <div className="p-4 sm:p-7 rounded-2xl border-2 border-dashed border-amber-600/40 bg-gradient-to-b from-[#fffefc] via-[#fdfaf3] to-amber-50/40 relative text-center shrink-0">
            {/* Top Crest & Monogram */}
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <WaxSealBadge text="H" size={44} title="Hogwarts Seal of Approval" />
              <div className="mt-1.5 text-[10px] tracking-widest font-magical font-bold text-amber-900 uppercase">
                Hogwarts School of Witchcraft and Wizardry
              </div>
              <div className="text-[9px] text-stone-500 tracking-wider">
                霍格沃茨魔法学校 · 魔法教育部特许认证
              </div>
            </div>

            {/* Certificate Title */}
            <h2 className="text-lg sm:text-2xl font-bold font-magical text-amber-950 mb-1">
              普通巫师等级考试 (O.W.L.s) 学业荣誉通报
            </h2>
            <p className="text-[10px] sm:text-[11px] text-stone-600 mb-4 sm:mb-6 font-reading">
              ORDINARY WIZARDING LEVEL ACADEMIC RECORD
            </p>

            {/* Hogwarts School Ribbon */}
            <div
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-amber-300/80 bg-amber-50/80 text-amber-900 mb-4 sm:mb-6 text-[11px] sm:text-xs font-bold max-w-full flex-wrap"
            >
              <Shield size={13} className="shrink-0 text-amber-700" />
              <span className="whitespace-nowrap">霍格沃茨魔法学校 · Hogwarts School</span>
              <span className="opacity-75 font-normal whitespace-nowrap">| “眠龙勿扰” Draco Dormiens Nunquam Titillandus</span>
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
            <div className="p-3 sm:p-3.5 rounded-xl border border-amber-400/60 bg-amber-500/10 mb-4 sm:mb-6 flex items-center justify-center gap-2.5 sm:gap-3 text-left">
              <WaxSealBadge text="O" size={30} title="杰出级 (Outstanding)" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-amber-950">
                  O.W.L.s 综合研学鉴定：杰出级 (O · Outstanding)
                </div>
                <div className="text-[10px] text-stone-600 mt-0.5 leading-snug">
                  该学员在英语原著精听研读与魔咒辨识中展现非凡专注，予以最高嘉奖。
                </div>
              </div>
            </div>

            {/* Dumbledore Signature Quote */}
            <div className="border-t border-amber-200/80 pt-3.5 sm:pt-4 text-center">
              <blockquote className="text-xs italic text-stone-700 font-reading mb-1.5 leading-relaxed">
                “决定我们成为什么样的人的，不是我们的能力，而是我们的选择。”
              </blockquote>
              <div className="text-[11px] font-bold font-magical text-amber-900">
                阿不思·邓布利多 (Albus Dumbledore)
              </div>
              <div className="text-[9px] text-stone-500 mt-0.5">
                霍格沃茨魔法学校校长 · 梅林爵士团一级大魔法师
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-4 sm:mt-5 flex items-center justify-between gap-2.5 sm:gap-3 flex-wrap shrink-0">
            <div className="text-[11px] text-stone-500 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-600" />
              <span>可复制喜报文本或一键导出官方羊皮纸荣誉长图</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="duo-touch-target px-3.5 py-2 rounded-xl border border-[#dec9a5] bg-white hover:bg-amber-50 text-xs font-bold text-amber-950 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? '已复制荣誉通报' : '复制喜报'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportImage}
                disabled={isExporting}
                className="duo-btn-primary min-h-[48px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="导出官方羊皮纸 O.W.L.s 学业荣誉高清长图，支持保存至手机相册或电脑下载"
              >
                {isExporting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                <span>{isExporting ? '生成高清长图中...' : '导出荣誉长图'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Screen Long-Press Image Preview Modal */}
      {showPreviewModal && exportedImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowPreviewModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="荣誉长图预览"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#e8ddd0] bg-[#fbf9f5] text-[#1e1610] p-4 sm:p-6 overflow-hidden pb-safe"
          >
            {/* Pull handle */}
            <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-[#e8ddd0] shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700">
                  <Download size={16} />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-amber-950 font-magical">
                  荣誉长图已生成
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-amber-950 transition-all active:scale-95 cursor-pointer"
                aria-label="关闭预览"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="mt-2.5 mb-2 px-3 py-2 rounded-xl bg-amber-100/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5 shrink-0">
              <Sparkles size={13} className="text-amber-700 shrink-0" />
              <span>长按下方长图可直接保存到手机相册或发送给好友</span>
            </div>

            {/* Image display */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2 text-center">
              <img
                src={exportedImageUrl}
                alt="霍格沃茨 O.W.L.s 学业荣誉通报长图"
                className="max-h-[60vh] mx-auto rounded-xl border border-amber-300/80 shadow-md object-contain"
              />
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 pt-3 border-t border-[#e8ddd0] flex items-center justify-end gap-2 shrink-0">
              {typeof navigator !== 'undefined' && navigator.canShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="duo-touch-target px-3.5 py-2.5 rounded-xl border border-[#dec9a5] bg-white text-xs font-bold text-amber-950 flex items-center gap-1.5 active:scale-95"
                >
                  <Share2 size={14} />
                  <span>系统分享</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadSavedImage}
                className="duo-btn-primary min-h-[48px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 active:scale-95"
              >
                <Download size={15} />
                <span>保存/下载图片</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OwlsCertificateModal;
