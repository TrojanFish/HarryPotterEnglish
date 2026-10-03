import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

export function ShortcutsModal({ isOpen, onClose, isParchment }) {
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

  const shortcuts = [
    { key: 'Space', desc: '播放 / 暂停音频' },
    { key: '← / →', desc: '跳转至 上一句 / 下一句' },
    { key: 'R', desc: '从头重播当前句子' },
    { key: 'L', desc: '切换 单句精听循环' },
    { key: 'M', desc: '切换 盲听遮罩 / 听写模式' },
    { key: '↑ / ↓', desc: '调节音量大小' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border-2 border-[#eee5d8] bg-white text-[#1e1610] shadow-[0_16px_48px_-8px_rgba(44,34,30,0.12)] p-6 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eee5d8]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/80 shadow-2xs">
              <Keyboard size={18} />
            </div>
            <h3 className="font-magical font-bold text-lg text-amber-950">
              精听快捷键指南
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="duo-touch-target rounded-xl border border-[#eee5d8] bg-white hover:bg-stone-100 text-stone-600 hover:text-amber-950 hover:border-amber-300 transition-all active:scale-90 shadow-2xs cursor-pointer"
            title="关闭快捷键指南 (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 my-3">
          {shortcuts.map((sc, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between p-2.5 rounded-xl border border-[#eee5d8] bg-[#fbf9f5] text-xs sm:text-sm"
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

        {/* Student Study Tips */}
        <div className="p-3.5 rounded-2xl border border-amber-300/80 bg-amber-500/10 text-stone-700 text-xs space-y-1.5 mt-4">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <span>中小学高效精听四步法：</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-stone-600">
            <li><strong>泛听感知</strong>：以 0.85x 或 1.0x 完整通听整章，掌握大意</li>
            <li><strong>逐句精析</strong>：打开双语译文，轻点生词查看纯正中文释义</li>
            <li><strong>磨耳朵盲听</strong>：开启迷雾遮罩，脱离文字单纯锻炼听辨能力</li>
            <li><strong>拼写闯关</strong>：进入听写教室，敲键盘闯关斩获魔法五角星</li>
          </ol>
        </div>

        <p className="text-xs text-center mt-3 text-stone-500">
          随时使用键盘空格键与方向键，无需鼠标即可行云流水地练习精听！
        </p>
      </div>
    </div>
  );
}
