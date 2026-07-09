import { GraduationCap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative animate-pulse-soft">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-edu-primary to-edu-primary-dark flex items-center justify-center shadow-xl shadow-edu-primary/20">
            <div className="animate-wobble">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl border-2 border-edu-primary/30 animate-pulse-ring" />
          <div className="absolute inset-0 rounded-2xl border-2 border-edu-primary/20 animate-pulse-ring-delayed" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-foreground animate-pulse-soft">
            শিক্ষা বাংলা
          </h2>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-edu-primary animate-dot-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        <div className="w-48 space-y-2">
          <div className="h-2 rounded-full bg-muted animate-loading-bar-1" />
          <div className="h-2 rounded-full bg-muted animate-loading-bar-2" />
          <div className="h-2 rounded-full bg-muted animate-loading-bar-3" />
        </div>
      </div>
    </div>
  )
}
