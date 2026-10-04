import React from 'react';
import { Sparkles, RefreshCw, ShieldAlert, HeartPulse } from 'lucide-react';

/**
 * Global Error Boundary & Self-Healing Resilience Component
 * Catches unhandled React runtime exceptions and provides zero-panic recovery:
 * 1. Soft Reload (重新施法)
 * 2. Safe Data Self-Healing (保留核心生词与连胜记录，清理破坏性UI脏缓存)
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      healed: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[Hogwarts ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSafeSelfHeal = () => {
    try {
      // 1. Backup critical user educational assets
      const vocabBackup = localStorage.getItem('hp_vocab_list');
      const streakBackup = localStorage.getItem('hp_learning_streak_v1');
      const syncIdBackup = localStorage.getItem('hp_sync_client_id');
      const turnersBackup = localStorage.getItem('hp_time_turners_count');

      // 2. Clear corrupted local storage
      localStorage.clear();

      // 3. Restore critical user assets
      if (vocabBackup) localStorage.setItem('hp_vocab_list', vocabBackup);
      if (streakBackup) localStorage.setItem('hp_learning_streak_v1', streakBackup);
      if (syncIdBackup) localStorage.setItem('hp_sync_client_id', syncIdBackup);
      if (turnersBackup) localStorage.setItem('hp_time_turners_count', turnersBackup);

      this.setState({ healed: true });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error('Self-heal failed:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fbf9f4] text-[#1e1610] flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-white border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 text-center animate-fadeIn shadow-none">
            {/* Hogwarts Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-300/50">
              <ShieldAlert size={32} />
            </div>

            <h1 className="font-magical font-bold text-2xl text-amber-950 mb-2">
              魔法受到微弱干扰
            </h1>
            <p className="text-xs sm:text-sm text-[#7a6448] font-reading mb-6 leading-relaxed">
              霍格沃茨魔法护盾已自动封锁异常区域。你的生词本与打卡天数安然无恙，请选择自愈方案以继续精听探险。
            </p>

            {/* Error Message Snippet */}
            {this.state.error && (
              <div className="bg-[#f7f3ed] rounded-xl p-3 mb-6 text-left border border-[#e8ddd0]">
                <p className="text-[11px] font-mono text-stone-500 font-bold uppercase tracking-wider mb-1">
                  异常魔力波动：
                </p>
                <p className="text-xs font-mono text-red-800 break-all leading-normal">
                  {this.state.error?.message || String(this.state.error)}
                </p>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full min-h-[46px] rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <RefreshCw size={16} />
                <span>重新施法（刷新页面）</span>
              </button>

              <button
                onClick={this.handleSafeSelfHeal}
                disabled={this.state.healed}
                className="w-full min-h-[46px] rounded-xl border-2 border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100/60 text-emerald-900 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <HeartPulse size={16} className="text-emerald-700" />
                <span>{this.state.healed ? '魔力自愈已完成，正在重启...' : '安全自愈（清理异常缓存，保留生词）'}</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eee5d8] text-[11px] text-stone-400 font-mono">
              Hogwarts Self-Healing Core v1.3 · Local-First Resilient
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
