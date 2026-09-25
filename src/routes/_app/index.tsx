import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/musify/home-page";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});
