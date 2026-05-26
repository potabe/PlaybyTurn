import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Trophy, Activity, Medal } from "lucide-react";
import { SPORT_EMOJIS, SPORT_LABELS } from "@/lib/utils/format";
import type { Session, Player } from "@/types/session";

interface ExportTemplateProps {
  session: Session;
  players: Player[];
  variant: "podium" | "full";
}

export const ExportTemplate = React.forwardRef<HTMLDivElement, ExportTemplateProps>(
  ({ session, players, variant }, ref) => {
    const sorted = [...players].sort((a, b) => {
      if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
      return b.point_differential - a.point_differential;
    });

    const spectatorUrl = typeof window !== "undefined"
      ? `${window.location.origin}/s/${session.spectator_code}`
      : `https://urturn.app/s/${session.spectator_code}`;

    const top3 = sorted.slice(0, 3);
    
    // Ensure we have exactly 3 for the podium display even if some are missing
    const first = top3[0];
    const second = top3[1];
    const third = top3[2];

    return (
      <div
        ref={ref}
        className="w-[450px] bg-slate-900 text-white p-8 font-sans overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-4xl mb-4 shadow-xl">
              {SPORT_EMOJIS[session.sport] ?? "🏆"}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2 leading-tight">
              {session.title}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest border border-white/10">
              {SPORT_LABELS[session.sport]} · Final Results
            </div>
          </div>

          {/* Content */}
          {variant === "podium" ? (
            <div className="py-8">
              <div className="flex items-end justify-center gap-4 h-[240px]">
                {/* 2nd Place */}
                {second && (
                  <div className="flex flex-col items-center w-[110px]">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full bg-slate-300 border-4 border-slate-400/50 flex items-center justify-center text-slate-600 text-2xl shadow-lg shadow-slate-400/20">
                        🥈
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <div className="font-bold text-white text-sm truncate w-full px-1">{second.name}</div>
                      <div className="text-slate-300 text-xs font-semibold">{second.points_won} pts</div>
                    </div>
                    <div className="w-full bg-slate-200/90 rounded-t-xl h-[120px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                      <div className="absolute bottom-4 w-full text-center text-slate-500 font-black text-3xl">2</div>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {first && (
                  <div className="flex flex-col items-center w-[130px] z-10">
                    <div className="relative mb-3">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      </div>
                      <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-yellow-200 flex items-center justify-center text-yellow-800 text-3xl shadow-xl shadow-yellow-500/30">
                        🥇
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <div className="font-black text-white text-base truncate w-full px-1">{first.name}</div>
                      <div className="text-yellow-400 text-sm font-bold">{first.points_won} pts</div>
                    </div>
                    <div className="w-full bg-yellow-400 rounded-t-xl h-[160px] relative overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
                      <div className="absolute bottom-6 w-full text-center text-yellow-600 font-black text-5xl">1</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {third && (
                  <div className="flex flex-col items-center w-[110px]">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full bg-amber-600 border-4 border-amber-500/50 flex items-center justify-center text-amber-200 text-2xl shadow-lg shadow-amber-600/20">
                        🥉
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <div className="font-bold text-white text-sm truncate w-full px-1">{third.name}</div>
                      <div className="text-amber-300 text-xs font-semibold">{third.points_won} pts</div>
                    </div>
                    <div className="w-full bg-amber-700/90 rounded-t-xl h-[90px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      <div className="absolute bottom-3 w-full text-center text-amber-900/60 font-black text-3xl">3</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-8">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-5 py-3 bg-white/10 border-b border-white/10 text-xs font-bold text-white/60 uppercase tracking-widest">
                <span className="w-6 text-center">#</span>
                <span>Player</span>
                <span className="text-center w-16">W-T-L</span>
                <span className="text-right w-12">Pts</span>
              </div>
              <div className="flex flex-col">
                {sorted.map((player, i) => {
                  const rank = i + 1;
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                  const losses = player.matches_played - player.matches_won;
                  
                  return (
                    <div
                      key={player.id}
                      className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 px-5 py-3.5 items-center border-b border-white/5 last:border-0 ${
                        rank === 1 ? "bg-yellow-500/10" : ""
                      }`}
                    >
                      <span className="w-6 text-center text-sm font-black text-white/60 flex-shrink-0">
                        {medal ?? rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-bold truncate ${rank === 1 ? "text-yellow-400" : "text-white"}`}>
                          {player.name}
                        </p>
                      </div>
                      <div className="text-center w-16">
                        <span className="text-xs font-medium text-white/70">
                          {player.matches_won}-{0}-{losses}
                        </span>
                      </div>
                      <div className="text-right w-12 flex-shrink-0">
                        <span className={`text-base font-black ${
                          rank === 1 ? "text-yellow-400" : 
                          rank === 2 ? "text-slate-300" : 
                          rank === 3 ? "text-amber-400" : "text-white"
                        }`}>
                          {player.points_won}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer with QR */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
                Scan for full match details
              </div>
              <div className="text-sm font-medium text-primary-300 break-all text-blue-300">
                {spectatorUrl}
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl flex-shrink-0 shadow-xl ml-4">
              <QRCodeSVG value={spectatorUrl} size={64} level="L" />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Powered by UrTurn
            </span>
          </div>
        </div>
      </div>
    );
  }
);
ExportTemplate.displayName = "ExportTemplate";
