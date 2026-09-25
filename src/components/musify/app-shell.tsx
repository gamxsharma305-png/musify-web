import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Search, Settings } from "lucide-react";
import { MiniPlayer } from "./mini-player";
import { NowPlaying } from "./now-playing";
import { PlaybackEngine } from "./youtube-player";
import { useMusify } from "@/lib/musify/store";
import { applyMusifyTheme } from "@/lib/musify/theme";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/search",
    label: "Search",
    icon: Search,
    match: (p: string) => p.startsWith("/search"),
  },
  {
    to: "/library",
    label: "Library",
    icon: BookOpen,
    match: (p: string) => p.startsWith("/library") || p.startsWith("/playlist") || p.startsWith("/artist"),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    match: (p: string) => p.startsWith("/settings") || p.startsWith("/about"),
  },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hasPlayer = useMusify(
    (s) => Boolean(s.queue[s.index]) || Boolean(s.radioName),
  );
  const accent = useMusify((s) => s.accent);
  const themeMode = useMusify((s) => s.themeMode);
  const pureBlack = useMusify((s) => s.pureBlack);

  useEffect(() => {
    applyMusifyTheme({ accent, mode: themeMode, pureBlack });
  }, [accent, themeMode, pureBlack]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (useMusify.getState().themeMode === "system") {
        applyMusifyTheme({
          accent: useMusify.getState().accent,
          mode: "system",
          pureBlack: useMusify.getState().pureBlack,
        });
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const hideNav = pathname.startsWith("/playlist") || pathname.startsWith("/artist");

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl bg-bg text-fg">
      <PlaybackEngine />
      <aside className="hidden w-[88px] shrink-0 flex-col items-center gap-2 border-r border-border pt-6 md:flex">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="flex w-full flex-col items-center gap-1 py-2"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl",
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-muted",
                )}
              >
                <Icon className="size-6" fill={active ? "currentColor" : "none"} />
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  active ? "text-fg" : "text-muted",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ paddingBottom: hasPlayer ? 100 : 8 }}
        >
          <Outlet />
        </main>
        <div
          className={cn(
            "sticky bottom-0 z-20 bg-bg",
            hideNav ? "md:block" : "",
          )}
        >
          <MiniPlayer />
          {!hideNav ? (
            <nav className="flex h-[70px] items-center justify-around px-2 md:hidden">
              {TABS.map((tab) => {
                const active = tab.match(pathname);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className="flex min-w-[64px] flex-col items-center gap-1"
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full",
                        active ? "bg-primary-container text-on-primary-container" : "text-muted",
                      )}
                    >
                      <Icon
                        className="size-6"
                        fill={active ? "currentColor" : "none"}
                        strokeWidth={active ? 0 : 2}
                      />
                    </span>
                    {active ? (
                      <span className="text-[12px] font-semibold text-fg">{tab.label}</span>
                    ) : (
                      <span className="h-4" />
                    )}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
      <NowPlaying />
    </div>
  );
}
