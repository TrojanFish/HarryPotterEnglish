import React, { useEffect, useState } from 'react';
import { X, Keyboard, Smartphone, Hand, Sparkles, Volume2, Mic, Repeat, MoveHorizontal, BookOpen } from 'lucide-react';

export function ShortcutsModal({ isOpen, onClose, isParchment }) {
  const [activeTab, setActiveTab] = useState('touch'); // 'touch' | 'keyboard'

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const keyboardShortcuts = [
    { key: 'Space', desc: '播放 / 暂停音频' },
    { key: '← / →', desc: '跳转至 上一句 / 下一句' },
    { key: 'R', desc: '从头重播当前句子' },
    { key: 'L', desc: '切换 单句精听循环' },
    { key: 'M', desc: '切换 磨耳朵 / 听写模式' },
    { key: 'Ctrl + B', desc: '展开 / 收起侧边栏' },
    { key: '↑ / ↓', desc: '调节音量大小' },
  ];

  const touchGestures = [
    { 
      icon: <Hand size={16} className="text-amber-600" />, 
      action: '轻点任意英文单词', 
      desc: '即时听英音示范、查看中文释义与魔法百科' 
    },
    { 
      icon: <MoveHorizontal size={16} className="text-amber-600" />, 
      action: '左右滑动字幕', 
      desc: '向左滑动切换下一句，向右滑动返回上一句，单手沉浸精听' 
    },
    { 
      icon: <Repeat size={16} className="text-amber-600" />, 
      action: '开启单句循环', 
      desc: '高频反复磨耳朵，直至听清连读与弱读' 
    },
    { 
      icon: <Mic size={16} className="text-amber-600" />, 
      action: '轻点跟读施咒', 
      desc: '录下自己的发音，AI 毫秒级评分纠音' 
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t-2 sm:border-2 border-[#e8ddd0] bg-white text-[#1e1610] p-5 sm:p-6 pb-safe transition-all duration-300 flex flex-col no-scrollbar"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-10 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 shrink-0" />

        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#e8ddd0] gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shrink-0">
              <Smartphone size={18} className="sm:hidden" />
              <Keyboard size={18} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-magical font-bold text-base sm:text-lg text-amber-950 truncate">
                精听操作指南
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 truncate">触屏手势与高效学习指引</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tab switch for desktop/mobile */}
            <div className="flex rounded-xl p-0.5 border border-[#e8ddd0] bg-stone-100 text-xs">
              <button
                onClick={() => setActiveTab('touch')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'touch' ? 'bg-amber-500 text-white' : 'text-stone-600 hover:text-amber-950'
                }`}
              >
                触屏手势
              </button>
              <button
                onClick={() => setActiveTab('keyboard')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'keyboard' ? 'bg-amber-500 text-white' : 'text-stone-600 hover:text-amber-950'
                }`}
              >
                键盘快捷键
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="duo-touch-target rounded-xl border border-[#e8ddd0] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 cursor-pointer shrink-0"
              title="关闭指南 (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Touch Gestures View */}
        {activeTab === 'touch' && (
          <div className="space-y-2.5 my-2">
            {touchGestures.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-3 rounded-2xl border border-[#e8ddd0] bg-[#fbf9f5]"
              >
                <div className="p-2 rounded-xl bg-white border border-[#e8ddd0] shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                    {item.action}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-relaxed font-reading">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard Shortcuts View */}
        {activeTab === 'keyboard' && (
          <div className="space-y-2 my-2">
            <div className="text-xs font-bold text-stone-400 mb-1.5">
              键盘操作快捷键（电脑 / 外接键盘）：
            </div>
            {keyboardShortcuts.map((sc, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#e8ddd0] bg-[#fbf9f5] text-xs sm:text-sm"
              >
                <span className="text-[#1e1610] font-medium">
                  {sc.desc}
                </span>
                <kbd className="px-2 py-1 rounded bg-amber-500/15 border border-amber-300/80 text-amber-900 font-mono font-bold text-xs">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        )}

        {/* Student Study Tips */}
        <div className="p-3.5 rounded-2xl border border-amber-300/80 bg-amber-500/10 text-stone-700 text-xs space-y-1.5 mt-3">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-700" />
            <span>高效精听四步法：</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-stone-600">
            <li><strong>泛听感知</strong>：以原速完整通听整章，掌握故事情节</li>
            <li><strong>逐句精析</strong>：打开双语译文，轻点生词记录百科释义</li>
            <li><strong>磨耳朵盲听</strong>：开启遮罩，脱离文字单凭听觉辨音</li>
            <li><strong>拼写大闯关</strong>：进入听写教室，拼写单词斩获魔法五角星</li>
          </ol>
        </div>

        {/* iOS Hardware Mute Switch & Audio Tip */}
        <div className="p-3 rounded-2xl border border-stone-200 bg-stone-50 text-stone-600 text-[11px] leading-relaxed mt-2.5">
          <span className="font-bold text-stone-800">iPhone / iPad 听音提示：</span>
          若开启机身侧边物理“静音拨片”，单词朗读示范与音效可能会被 iOS 系统静音。建议关闭静音拨片以获得完整听力体验。
        </div>

        <p className="text-[11px] sm:text-xs text-center mt-3 text-stone-500">
          支持手机触屏单手轻松操作，随时随地开启英语原声探险！
        </p>
      </div>
    </div>
  );
}
