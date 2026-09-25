import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Artwork } from "./artwork";
import { radioStations } from "@/lib/musify/catalog";
import { useMusify } from "@/lib/musify/store";

export function RadioPage() {
  const navigate = useNavigate();
  const playRadio = useMusify((s) => s.playRadio);
  const stations = radioStations();

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="Back"
          className="flex size-11 items-center justify-center text-muted"
          onClick={() => navigate({ to: "/library" })}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="musify-title flex-1 text-center text-[26px] text-primary">Radio Stations</h1>
        <span className="size-11" />
      </header>
      <div className="grid grid-cols-2 gap-3 px-2.5 pb-6">
        {stations.map((station) => (
          <button
            key={station.id}
            type="button"
            className="overflow-hidden rounded-xl bg-surface-low text-left"
            onClick={() => playRadio(station)}
          >
            <Artwork src={station.image} alt={station.name} className="aspect-square w-full" />
            <span className="block px-3 pt-2 text-sm font-semibold text-primary">{station.name}</span>
            <span className="block px-3 pb-3 text-xs text-muted">{station.genre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
