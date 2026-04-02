"use client";

import { useEffect, useState } from "react";
import { X, Heart, Sparkles } from "@/components/icons";

interface ImpactToastProps {
  currentHelpfulVotes: number;
}

export function ImpactToast({ currentHelpfulVotes }: ImpactToastProps) {
  const [show, setShow] = useState(false);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (currentHelpfulVotes <= 0) return;

    const key = "anshin_last_helpful_votes";
    const lastSeen = parseInt(localStorage.getItem(key) || "0", 10);

    if (currentHelpfulVotes > lastSeen) {
      setDelta(currentHelpfulVotes - lastSeen);
      setShow(true);
      // Update local storage so we don't show it again until score increases
      localStorage.setItem(key, currentHelpfulVotes.toString());
      
      // Auto-hide after 6 seconds
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [currentHelpfulVotes]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-coral-500 to-coral-600 text-white p-4 rounded-2xl shadow-xl border border-coral-400/50 relative overflow-hidden">
        {/* Sparkle background effects */}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-20">
          <Sparkles className="w-24 h-24" />
        </div>
        
        <button 
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white text-coral-500 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] mb-0.5 drop-shadow-sm">
              嬉しいお知らせです！
            </h3>
            <p className="text-[13px] text-white/95 leading-snug">
              あなたの投稿が新たに <strong className="text-[15px] font-extrabold mx-0.5">{delta}人</strong> の親御さんを助けました✨<br/>
              現在の累計感謝数: {currentHelpfulVotes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
