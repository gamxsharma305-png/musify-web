import {
  CircleHelp,
  Clock,
  Contrast,
  Languages,
  Music,
  Palette,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CustomBar } from "./custom-bar";
import { SectionHeader } from "./section-header";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ACCENT_COLORS } from "@/lib/musify/catalog";
import { useMusify } from "@/lib/musify/store";
import { toast } from "sonner";
import type { AudioQuality, ThemeMode } from "@/lib/musify/types";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const navigate = useNavigate();
  const accent = useMusify((s) => s.accent);
  const setAccent = useMusify((s) => s.setAccent);
  const themeMode = useMusify((s) => s.themeMode);
  const setThemeMode = useMusify((s) => s.setThemeMode);
  const pureBlack = useMusify((s) => s.pureBlack);
  const setPureBlack = useMusify((s) => s.setPureBlack);
  const audioQuality = useMusify((s) => s.audioQuality);
  const setAudioQuality = useMusify((s) => s.setAudioQuality);
  const statsEnabled = useMusify((s) => s.listeningStatsEnabled);
  const setStats = useMusify((s) => s.setListeningStatsEnabled);

  const [accentOpen, setAccentOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-center">
        <h1 className="musify-title text-[30px] text-primary">Settings</h1>
      </header>
      <div className="px-2.5 pb-6">
        <SectionHeader title="Preferences" />
        <div className="overflow-hidden rounded-xl">
          <CustomBar
            title="Accent color"
            icon={Palette}
            radius="first"
            onClick={() => setAccentOpen(true)}
          />
          <CustomBar
            title="Theme mode"
            icon={Sun}
            onClick={() => setThemeOpen(true)}
          />
          <CustomBar
            title="Language"
            icon={Languages}
            onClick={() => toast("Language updated successfully")}
          />
          <CustomBar
            title="Audio quality"
            icon={Music}
            onClick={() => setQualityOpen(true)}
          />
          <CustomBar
            title="Equalizer"
            icon={SlidersHorizontal}
            onClick={() => toast("Equalizer is available on Android only.")}
          />
          {themeMode === "dark" ? (
            <CustomBar
              title="Pure black theme"
              icon={Contrast}
              description="Use a true black background in dark mode for OLED displays."
              trailing={
                <Switch
                  checked={pureBlack}
                  onCheckedChange={(v) => {
                    setPureBlack(v);
                    toast("Settings updated successfully");
                  }}
                />
              }
            />
          ) : null}
          <CustomBar
            title="Listening stats"
            icon={Clock}
            description="Track local listening stats for monthly and yearly recaps."
            radius="last"
            trailing={
              <Switch
                checked={statsEnabled}
                onCheckedChange={(v) => {
                  setStats(v);
                  toast("Settings updated successfully");
                }}
              />
            }
          />
        </div>

        <SectionHeader title="Others" />
        <div className="overflow-hidden rounded-xl">
          <CustomBar
            title="About"
            icon={CircleHelp}
            radius="all"
            onClick={() => navigate({ to: "/about" })}
          />
        </div>
      </div>

      <Dialog open={accentOpen} onOpenChange={setAccentOpen}>
        <DialogContent>
          <DialogTitle>Accent color</DialogTitle>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                className={cn(
                  "size-12 rounded-full border-2",
                  accent.toLowerCase() === color.toLowerCase()
                    ? "border-fg"
                    : "border-transparent",
                )}
                style={{ background: color }}
                onClick={() => {
                  setAccent(color);
                  setAccentOpen(false);
                  toast("Accent color updated successfully");
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent>
          <DialogTitle>Theme mode</DialogTitle>
          <div className="mt-4 flex flex-col gap-2">
            {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
              <ButtonChoice
                key={mode}
                active={themeMode === mode}
                label={mode[0]!.toUpperCase() + mode.slice(1)}
                onClick={() => {
                  setThemeMode(mode);
                  setThemeOpen(false);
                  toast("Settings updated successfully");
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qualityOpen} onOpenChange={setQualityOpen}>
        <DialogContent>
          <DialogTitle>Audio quality</DialogTitle>
          <div className="mt-4 flex flex-col gap-2">
            {(["low", "medium", "high"] as AudioQuality[]).map((q) => (
              <ButtonChoice
                key={q}
                active={audioQuality === q}
                label={q[0]!.toUpperCase() + q.slice(1)}
                onClick={() => {
                  setAudioQuality(q);
                  setQualityOpen(false);
                  toast("Audio quality updated");
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ButtonChoice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-3 text-left text-sm font-medium",
        active
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface-high text-fg",
      )}
    >
      {label}
    </button>
  );
}
