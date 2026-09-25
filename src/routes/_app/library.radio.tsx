import { createFileRoute } from "@tanstack/react-router";
import { RadioPage } from "@/components/musify/radio-page";

export const Route = createFileRoute("/_app/library/radio")({
  component: RadioPage,
});
