import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="Back"
          className="flex size-11 items-center justify-center text-muted"
          onClick={() => navigate({ to: "/settings" })}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="musify-title flex-1 text-center text-[26px] text-primary">About</h1>
        <span className="size-11" />
      </header>
      <div className="flex flex-1 flex-col items-center px-6 py-8 text-center">
        <img src="/musify-icon.png" alt="GMAX" className="size-24" />
        <h2 className="musify-title mt-4 text-3xl text-primary">GMAX.</h2>
        <p className="mt-2 text-sm text-muted">Version 10.4.0</p>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-fg">
          GMAX — stream songs, playlists, and radio in the browser with
          the same Material look. Based on the original Android app by Valeri Gokadze, licensed under GPL-3.0.
        </p>
        <p className="mt-6 max-w-md text-xs leading-relaxed text-muted">
          GMAX and its contributors do not host, own, or distribute copyrighted audio
          content. Playback uses YouTube embeds and public radio streams. All songs remain
          the property of their respective owners.
        </p>
      </div>
    </div>
  );
}
