"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProject } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function statusColor(status: string) {
  switch (status) {
    case "TODO": return "secondary";
    case "IN_PROGRESS": return "default";
    case "IN_REVIEW": return "outline";
    case "DONE": return "secondary";
    default: return "secondary";
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-32 rounded bg-gray-200" />
      </div>
    );
  }

  if (!project) return null;

  const currentMembership = project.members.find(
    (m: { user: { id: string } }) => m.user.id === session?.user?.id
  );
  const isAdmin = currentMembership?.role === "ADMIN";

  const tasksByStatus = {
    TODO: project.tasks.filter((t: { status: string }) => t.status === "TODO").length,
    IN_PROGRESS: project.tasks.filter((t: { status: string }) => t.status === "IN_PROGRESS").length,
    IN_REVIEW: project.tasks.filter((t: { status: string }) => t.status === "IN_REVIEW").length,
    DONE: project.tasks.filter((t: { status: string }) => t.status === "DONE").length,
  };

  const total = project.tasks.length;
  const progress = total > 0 ? Math.round((tasksByStatus.DONE / total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/tasks`}>
            <Button>View Tasks</Button>
          </Link>
          <Link href={`/projects/${id}/members`}>
            <Button variant="outline">{isAdmin ? "Manage Team" : "View Team"}</Button>
          </Link>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-400">{tasksByStatus.TODO}</p>
              <p className="text-xs text-gray-500">To Do</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{tasksByStatus.IN_PROGRESS}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{tasksByStatus.IN_REVIEW}</p>
              <p className="text-xs text-gray-500">In Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{tasksByStatus.DONE}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team ({project.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {project.members.map((member: { id: string; role: string; user: { id: string; name: string; email: string } }) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1"
              >
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                  {member.user.name[0]}
                </div>
                <span className="text-sm">{member.user.name}</span>
                <Badge variant={member.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <Link href={`/projects/${id}/tasks`}>
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {project.tasks.slice(0, 5).map((task: { id: string; title: string; status: string; priority: string; assignee: { name: string } | null }) => (
                <div key={task.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.assignee?.name || "Unassigned"}
                    </p>
                  </div>
                  <Badge variant={statusColor(task.status)}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
