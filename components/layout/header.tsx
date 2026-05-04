"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useQueryClient } from "@tanstack/react-query";

const pageLabels: Record<string, string> = {
  projects: "Projects",
  tasks: "Tasks",
  members: "Members",
  settings: "Settings",
  new: "New Project",
};

function isCuid(segment: string): boolean {
  return /^c[a-z0-9]{20,30}$/.test(segment);
}

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const queryClient = useQueryClient();

  function getBreadcrumb(): string {
    if (pathname === "/") return "Dashboard";

    const segments = pathname.split("/").filter(Boolean);
    const labels: string[] = [];

    for (const segment of segments) {
      if (isCuid(segment)) {
        // Try to get project name from TanStack Query cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectData = queryClient.getQueryData<any>(["projects", segment]);
        if (projectData?.name) {
          labels.push(projectData.name);
        } else {
          // Also check the projects list cache
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const projectsList = queryClient.getQueryData<any[]>(["projects"]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = projectsList?.find((p: any) => p.id === segment);
          if (found?.name) {
            labels.push(found.name);
          }
          // If not found in cache, skip the ID entirely
        }
      } else {
        labels.push(pageLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));
      }
    }

    return labels.join(" / ") || "Dashboard";
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-white px-4 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden -ml-1 p-1.5"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      <h2 className="text-base font-semibold text-gray-900 truncate">
        {title || getBreadcrumb()}
      </h2>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-500">
          {session?.user?.name?.split(" ")[0]}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
          {session?.user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
