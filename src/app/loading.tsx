import { Loader2 } from "@/components/icons";

export default function Loading() {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] w-full fade-in z-50">
 <div className="w-16 h-16 bg-white rounded-3xl border-[1.5px] border-[var(--color-border)] flex items-center justify-center mb-6 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent" />
 <Loader2 className="w-7 h-7 text-[var(--color-primary)] animate-spin relative z-10" />
 </div>
 <p className="text-[13px] font-bold text-[var(--color-text-secondary)] tracking-widest animate-pulse">
 Now Loading...
 </p>
 </div>
 );
}
