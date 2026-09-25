import { createFileRoute } from "@tanstack/react-router";
import { UserSongsPage } from "@/components/musify/user-songs-page";

export const Route = createFileRoute("/_app/library/songs/$kind")({
  component: UserSongsRoute,
});

function UserSongsRoute() {
  const { kind } = Route.useParams();
  return <UserSongsPage kind={kind} />;
}
