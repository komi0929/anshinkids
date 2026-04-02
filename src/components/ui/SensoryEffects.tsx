"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, ReactNode } from "react";

interface BurstEvent {
  id: number;
  x: number;
  y: number;
}

/**
 * 画面上のどこでもパーティクル（破片）を弾けさせるための
 * 極めて軽量なグローバルプロバイダーとフックです。
 */
export function SensoryEffectsProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<BurstEvent[]>([]);

  useEffect(() => {
    const handleBurst = (e: CustomEvent<{ x: number; y: number }>) => {
      const id = Date.now();
      setBursts(prev => [...prev, { id, x: e.detail.x, y: e.detail.y }]);
      // 1秒後に削除
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== id));
      }, 1000);
    };

    window.addEventListener("anshin_burst", handleBurst as EventListener);
    return () => window.removeEventListener("anshin_burst", handleBurst as EventListener);
  }, []);

  return (
    <>
      {children}
      {bursts.map(burst => (
        <ConfettiCluster key={burst.id} x={burst.x} y={burst.y} />
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
}

function ConfettiCluster({ x, y }: { x: number; y: number }) {
  // アイコンの中心付近から出るように微調整
  const originX = x - 5;
  const originY = y - 5;
  
  const elements = ["❤️", "✨", "🌿", "🔖"];
  
  const [particles] = useState<ParticleConfig[]>(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 30 + Math.random() * 50;
      return {
        id: i,
        x: Math.cos(angle) * velocity + (Math.random() - 0.5) * 20,
        y: Math.sin(angle) * velocity + (Math.random() - 0.5) * 20 - 20,
        rotate: Math.random() * 360,
        duration: 0.5 + Math.random() * 0.3
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
                scale: [0, 1.2, 0.5], 
                x: p.x, 
                y: p.y,
                opacity: [1, 1, 0],
                rotate: p.rotate
              }}
              transition={{ duration: p.duration, ease: "easeOut" }}
              className="absolute w-4 h-4 flex items-center justify-center text-[11px]"
            >
              {elements[i % elements.length]}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

/** イベント発火用ユーティリティ */
export const triggerSensoryBurst = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
  let x = 0, y = 0;
  if ('clientX' in e) {
    x = e.clientX;
    y = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  }
  
  if (x === 0 && y === 0) return; // fail-safe

  const event = new CustomEvent("anshin_burst", { detail: { x, y } });
  window.dispatchEvent(event);
};
