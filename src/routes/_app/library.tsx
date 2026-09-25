import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { LibraryPage } from "@/components/musify/library-page";

export const Route = createFileRoute("/_app/library")({
  component: LibraryLayout,
});

function LibraryLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/library") return <LibraryPage />;
  return <Outlet />;
}
