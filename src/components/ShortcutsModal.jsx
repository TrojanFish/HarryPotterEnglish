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
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all duration-300 ${
          isParchment 
            ? 'bg-[#fbf6ea] border-[#dec9a5] text-[#2c221e]' 
            : 'bg-[#141b26] border-[#2b3a4f] text-[#e2d9c8]'
        }`}
      >
        <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
          isParchment ? 'border-[#dec9a5]' : 'border-gray-700/40'
        }`}>
          <div className="flex items-center space-x-2">
            <Keyboard className="text-[#cba358]" size={20} />
            <h3 className="font-magical font-bold text-lg text-[#cba358]">
              精听快捷键指南
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 my-3">
          {shortcuts.map((sc, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs sm:text-sm ${
                isParchment 
                  ? 'bg-[#f3ead7] border-[#dec9a5]' 
                  : 'bg-black/10 border-gray-700/30'
              }`}
            >
              <span className={isParchment ? 'text-[#3c2a1e] font-semibold' : 'text-gray-300'}>
                {sc.desc}
              </span>
              <kbd className="px-2 py-1 rounded bg-[#cba358]/20 border border-[#cba358]/40 text-[#cba358] font-mono font-bold text-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className={`text-xs text-center mt-4 ${isParchment ? 'text-[#6b543e]' : 'text-[#8c9ba5]'}`}>
          随时使用空格键与方向键，无需鼠标移动即可行云流水地练习精听！
        </p>
      </div>
    </div>
  );
}
