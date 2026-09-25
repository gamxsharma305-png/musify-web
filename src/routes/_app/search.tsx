import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/components/musify/search-page";

export const Route = createFileRoute("/_app/search")({
  component: SearchPage,
});
