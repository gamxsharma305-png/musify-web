import { createFileRoute } from "@tanstack/react-router";
import { PlaylistPage } from "@/components/musify/playlist-page";

export const Route = createFileRoute("/_app/playlist/$ytid")({
  component: PlaylistRoute,
});

function PlaylistRoute() {
  const { ytid } = Route.useParams();
  return <PlaylistPage ytid={ytid} />;
}
