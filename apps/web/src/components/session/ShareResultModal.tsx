"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExportTemplate } from "@/components/export/ExportTemplates";
import { Download, Loader2, Image as ImageIcon, List } from "lucide-react";
import type { Session, Player } from "@/types/session";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  players: Player[];
}

export function ShareResultModal({ open, onOpenChange, session, players }: Props) {
  const [variant, setVariant] = useState<"podium" | "full">("podium");
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      
      // We use a short delay to ensure fonts/images are fully loaded
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High quality
        quality: 1,
      });

      const link = document.createElement("a");
      link.download = `urturn-${session.title.replace(/\s+/g, "-").toLowerCase()}-results.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-fit sm:max-w-lg bg-slate-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Share Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selector */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setVariant("podium")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                variant === "podium" ? "bg-card text-foreground shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Podium Mode
            </button>
            <button
              onClick={() => setVariant("full")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
                variant === "full" ? "bg-card text-foreground shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-4 h-4" /> Full Table
            </button>
          </div>

          {/* Preview container */}
          <div className="bg-slate-200 rounded-2xl p-2 sm:p-4 flex justify-center overflow-y-auto max-h-[60vh]">
             <div className="shadow-2xl rounded-2xl overflow-hidden w-full max-w-[400px] shrink-0">
               <ExportTemplate ref={printRef} session={session} players={players} variant={variant} />
             </div>
          </div>
          <p className="text-center text-xs text-muted-foreground -mt-2">
            This is a preview. The downloaded image will be in high resolution.
          </p>

          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Rendering Image...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" /> Download Image
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
