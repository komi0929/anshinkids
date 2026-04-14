"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, ReactNode } from "react";

interface BurstEvent {
  id: number;
  x: number;
  y: number;
  emoji?: string;
}

/**
 * 画面上のどこでもパーティクル（破片）を弾けさせるための
 * 極めて軽量なグローバルプロバイダーとフックです。
 */
export function SensoryEffectsProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<BurstEvent[]>([]);

  useEffect(() => {
    const handleBurst = (e: CustomEvent<{ x: number; y: number, emoji?: string }>) => {
      const id = Date.now();
      setBursts(prev => [...prev, { id, x: e.detail.x, y: e.detail.y, emoji: e.detail.emoji }]);
      // 2秒後に削除 (長くふわっと見せるため)
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== id));
      }, 2000);
    };

    window.addEventListener("anshin_burst", handleBurst as EventListener);
    return () => window.removeEventListener("anshin_burst", handleBurst as EventListener);
  }, []);

  return (
    <>
      {children}
      {bursts.map(burst => (
        <ConfettiCluster key={burst.id} x={burst.x} y={burst.y} emoji={burst.emoji} />
      ))}
    </>
  );
}

interface ParticleConfig {
  id: number;
  x: number;
  y: number;
  rotate: number;
  duration: number;
  scale: number;
}

function ConfettiCluster({ x, y, emoji }: { x: number; y: number; emoji?: string }) {
  const originX = x - 5;
  const originY = y - 5;
  
  // 指定された絵文字がない場合のデフォルト粒子
  const elements = emoji ? [emoji] : ["✨", "🌿", "🔖", "⭐"];
  
  const [particles] = useState<ParticleConfig[]>(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      // 空へ向かって舞い上がるように（上方向の角度に集中）
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; 
      const velocity = 50 + Math.random() * 80;
      return {
        id: i,
        x: Math.cos(angle) * velocity + (Math.random() - 0.5) * 20,
        y: Math.sin(angle) * velocity - 40 - Math.random() * 40,
        rotate: (Math.random() - 0.5) * 90,
        duration: 1.0 + Math.random() * 0.8,
        scale: 0.8 + Math.random() * 0.7
      };
    });
  });

  return (
    <div className="fixed pointer-events-none z-[9999]" style={{ left: originX, top: originY }}>
      <AnimatePresence>
        {particles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{ 
                scale: [0, p.scale, p.scale * 0.8, 0], 
                x: p.x, 
                y: p.y,
                opacity: [1, 1, 0.8, 0],
                rotate: p.rotate
              }}
              transition={{ duration: p.duration, ease: [0.23, 1, 0.32, 1] }}
              className="absolute w-4 h-4 flex items-center justify-center text-[18px] filter drop-shadow-md"
            >
              {elements[i % elements.length]}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

/** イベント発火用ユーティリティ */
export const triggerSensoryBurst = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent, emoji?: string) => {
  let x = 0, y = 0;
  if ('clientX' in e) {
    x = e.clientX;
    y = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }
  
  if (x === 0 && y === 0) return; // fail-safe

  const event = new CustomEvent("anshin_burst", { detail: { x, y, emoji } });
  window.dispatchEvent(event);
};
