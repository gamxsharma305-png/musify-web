import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ArtistPage } from "@/components/musify/artist-page";

export const Route = createFileRoute("/_app/artist/$id")({
  validateSearch: z.object({
    name: z.string().optional(),
  }),
  component: ArtistRoute,
});

function ArtistRoute() {
  const { id } = Route.useParams();
  const { name } = Route.useSearch();
  return <ArtistPage id={id} name={name} />;
}
