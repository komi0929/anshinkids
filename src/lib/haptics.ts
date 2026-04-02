/**
 * 触覚フィードバック (Haptics) ユーティリティ
 * 
 * navigator.vibrate を安全に呼び出し、iOS/Androidにおける
 * ネイティブアプリのような物理的な手触りを提供します。
 */

export const Haptics = {
  /** 軽いタップ感 (例: ブックマークのトグル) */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  
  /** 強いタップ感 (例: Thanks送信、メインのメッセージ送信) */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 40]);
    }
  },

  /** 警告・エラー時の重い振動 */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  }
};
