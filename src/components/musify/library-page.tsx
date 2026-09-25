import {
  CloudOff,
  Heart,
  History,
  Plus,
  Radio,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SectionHeader } from "./section-header";
import { PlaylistBar } from "./playlist-bar";
import { useMusify } from "@/lib/musify/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findCurated } from "@/lib/musify/catalog";
import { toast } from "sonner";

export function LibraryPage() {
  const navigate = useNavigate();
  const customPlaylists = useMusify((s) => s.customPlaylists);
  const likedPlaylists = useMusify((s) => s.likedPlaylists);
  const pinnedIds = useMusify((s) => s.pinnedIds);
  const createPlaylist = useMusify((s) => s.createPlaylist);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const pinned = pinnedIds
    .map((id) => customPlaylists.find((p) => p.ytid === id) || findCurated(id) || likedPlaylists.find((p) => p.ytid === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-center">
        <h1 className="musify-title text-[30px] text-primary">Library</h1>
      </header>
      <div className="px-2.5 pb-4">
        {pinned.length > 0 ? (
          <section>
            <SectionHeader title="Pinned" />
            <div className="overflow-hidden rounded-xl">
              {pinned.map((p, i) => (
                <PlaylistBar
                  key={p.ytid}
                  title={p.title}
                  playlist={p}
                  image={p.image}
                  showMenu
                  radius={i === 0 ? "first" : i === pinned.length - 1 ? "last" : "none"}
                  onClick={() =>
                    navigate({ to: "/playlist/$ytid", params: { ytid: p.ytid } })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader
            title="Custom playlists"
            action={
              <button
                type="button"
                aria-label="Add playlist"
                className="flex size-11 items-center justify-center text-muted"
                onClick={() => setOpen(true)}
              >
                <Plus className="size-5" />
              </button>
            }
          />
          <div className="overflow-hidden rounded-xl">
            <PlaylistBar
              title="Recently played"
              icon={<History className="size-6" />}
              radius="first"
              onClick={() =>
                navigate({ to: "/library/songs/$kind", params: { kind: "recents" } })
              }
            />
            <PlaylistBar
              title="Liked songs"
              icon={<Heart className="size-6" />}
              onClick={() =>
                navigate({ to: "/library/songs/$kind", params: { kind: "liked" } })
              }
            />
            <PlaylistBar
              title="Offline songs"
              icon={<CloudOff className="size-6" />}
              onClick={() =>
                navigate({ to: "/library/songs/$kind", params: { kind: "offline" } })
              }
            />
            <PlaylistBar
              title="Radio Stations"
              icon={<Radio className="size-6" />}
              radius={customPlaylists.length === 0 ? "last" : "none"}
              onClick={() => navigate({ to: "/library/radio" })}
            />
            {customPlaylists.map((p, i) => (
              <PlaylistBar
                key={p.ytid}
                title={p.title}
                playlist={p}
                image={p.image}
                showMenu
                radius={i === customPlaylists.length - 1 ? "last" : "none"}
                onClick={() =>
                  navigate({ to: "/playlist/$ytid", params: { ytid: p.ytid } })
                }
              />
            ))}
          </div>
        </section>

        {likedPlaylists.length > 0 ? (
          <section>
            <SectionHeader title="Liked playlists" />
            <div className="overflow-hidden rounded-xl">
              {likedPlaylists.map((p, i) => (
                <PlaylistBar
                  key={p.ytid}
                  title={p.title}
                  playlist={p}
                  image={p.image}
                  showMenu
                  radius={
                    i === 0 && likedPlaylists.length === 1
                      ? "first"
                      : i === 0
                        ? "first"
                        : i === likedPlaylists.length - 1
                          ? "last"
                          : "none"
                  }
                  onClick={() =>
                    navigate({ to: "/playlist/$ytid", params: { ytid: p.ytid } })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Create playlist</DialogTitle>
          <Input
            className="mt-4"
            placeholder="Custom playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  toast("Please enter a playlist name");
                  return;
                }
                createPlaylist(name.trim());
                setName("");
                setOpen(false);
                toast("Added successfully");
              }}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
