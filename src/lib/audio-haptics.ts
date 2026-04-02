/**
 * オーディオ・ハプティクス (Web Audio API Synthesizer)
 * 外部のMP3やWAVファイルを使用せず、ブラウザ内蔵のシンセサイザーで
 * 極めて軽量・高品質なUIサウンドを生成します。
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function initAudio() {
  if (typeof window === "undefined") return false;
  const extWindow = window as ExtendedWindow;
  if (!window.AudioContext && !extWindow.webkitAudioContext) return false;
  
  if (!audioCtx) {
    const Ctx = window.AudioContext || extWindow.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.3; // 全体音量を控えめに
      masterGain.connect(audioCtx.destination);
    }
  }
  
  // ユーザーインタラクションにより中断されている場合は再開
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return true;
}

export const AudioHaptics = {
  /** 
   * Thanks❤️時の清涼感のあるティン♪音 
   */
  playTink: () => {
    if (!initAudio() || !audioCtx || !masterGain) return;
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // サイン波の高音でグラスのような音
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
    
    // アタックが早く、スッと消えるエンベロープ
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(t);
    osc.stop(t + 0.3);
  },

  /** 
   * 送信時の柔らかなポッという音 
   */
  playPop: () => {
    if (!initAudio() || !audioCtx || !masterGain) return;
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // 丸い音色のサイン波
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1); // ピッチドロップで「ポッ」感
    
    // まろやかなエンベロープ
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(t);
    osc.stop(t + 0.15);
  }
};
