"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRelativeDate, getGreeting } from "@/lib/format";

function StatsCards({ stats }: { stats: Record<string, number> }) {
  const cards = [
    { label: "Total Tasks", value: stats.totalTasks, color: "text-gray-900", bg: "bg-gray-50" },
    { label: "In Progress", value: stats.inProgressTasks, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Overdue", value: stats.overdueTasks, color: "text-red-600", bg: "bg-red-50" },
    { label: "Completed", value: stats.doneTasks, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function priorityColor(priority: string) {
  switch (priority) {
    case "URGENT": return "destructive";
    case "HIGH": return "default";
    case "MEDIUM": return "secondary";
    case "LOW": return "outline";
    default: return "secondary";
  }
}

function statusDotColor(status: string): string {
  switch (status) {
    case "TODO": return "bg-gray-400";
    case "IN_PROGRESS": return "bg-blue-500";
    case "IN_REVIEW": return "bg-yellow-500";
    case "DONE": return "bg-green-500";
    default: return "bg-gray-400";
  }
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      <StatsCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data.myTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks assigned to you</p>
            ) : (
              <div className="space-y-3">
                {data.myTasks.map((task: { id: string; title: string; priority: string; status: string; dueDate: string | null; project: { id: string; name: string } }) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project.id}/tasks`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">{task.project.name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant={priorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {isOverdue(task.dueDate, task.status) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {data.projectSummaries.length === 0 ? (
              <p className="text-sm text-gray-500">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {data.projectSummaries.map((project: { id: string; name: string; progress: number; totalTasks: number; completedTasks: number }) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-md border p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {project.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {project.completedTasks}/{project.totalTasks} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {data.recentTasks.map((task: { id: string; title: string; status: string; updatedAt: string; assignee: { name: string } | null; project: { id: string; name: string } }) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.project.name} &middot; {task.assignee?.name || "Unassigned"} &middot; {formatRelativeDate(task.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusDotColor(task.status)}`} />
                    <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
