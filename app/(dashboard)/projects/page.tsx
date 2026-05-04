"use client";

import { useProjects } from "@/hooks/use-projects";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new">
          <Button>Create Project</Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: { id: string; name: string; description?: string; members: { role: string; user: { id: string; name: string } }[]; _count: { tasks: number } }) => {
            const userMembership = project.members.find(
              (m: { user: { id: string } }) => m.user.id === session?.user?.id
            ) || project.members[0];
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <Badge variant={userMembership?.role === "ADMIN" ? "default" : "secondary"}>
                        {userMembership?.role || "MEMBER"}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <span>{project.members.length} members</span>
                      <span>{project._count.tasks} tasks</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
