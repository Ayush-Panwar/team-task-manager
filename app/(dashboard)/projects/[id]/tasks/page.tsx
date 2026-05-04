"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useMembers } from "@/hooks/use-members";
import { useProject } from "@/hooks/use-projects";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "sonner";
import { formatDueDate } from "@/lib/format";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, getPriorityColor, getPriorityBorderColor } from "@/lib/constants";

const statuses = STATUS_OPTIONS.map((s) => s.value);
const priorities = PRIORITY_OPTIONS.map((p) => p.value);

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export default function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const params: Record<string, string> = {};
  if (filterStatus !== "ALL") params.status = filterStatus;

  const { data: tasks, isLoading, isFetching } = useTasks(id, params);
  const { data: project } = useProject(id);
  const { data: members } = useMembers(id);
  const createTask = useCreateTask(id);
  const updateTask = useUpdateTask(id);
  const deleteTask = useDeleteTask(id);

  // Determine current user's role in this project
  const currentUserId = session?.user?.id;
  const currentMembership = members?.find(
    (m: { user: { id: string } }) => m.user.id === currentUserId
  );
  const isAdmin = currentMembership?.role === "ADMIN";

  function canEditTask(task: { assigneeId?: string | null; creatorId?: string; creator?: { id: string } | null }) {
    if (isAdmin) return true;
    const isAssignee = task.assigneeId === currentUserId;
    const isCreator = task.creatorId === currentUserId || task.creator?.id === currentUserId;
    return isAssignee || isCreator;
  }

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
  });

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        assigneeId: newTask.assigneeId || null,
        dueDate: newTask.dueDate || null,
      });
      toast.success("Task created");
      setNewTask({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
      setShowCreateDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    }
  }

  function handleStatusChange(taskId: string, status: string) {
    updateTask.mutate(
      { taskId, data: { status } },
      {
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update status");
        },
      }
    );
  }

  function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    deleteTask.mutate(taskId, {
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete task");
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const memberOptions = (members || []).map((m: { user: { id: string; name: string } }) => ({
    value: m.user.id,
    label: m.user.name,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {project?.name} - Tasks
          </h1>
          {isFetching && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          )}
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <NativeSelect
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    options={priorities.map((p) => ({ value: p, label: p }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <NativeSelect
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    options={memberOptions}
                    placeholder="Unassigned"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createTask.isPending}>
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("ALL")}
        >
          All
        </Button>
        {statuses.map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {statusLabel(s)}
          </Button>
        ))}
      </div>

      {/* Task List */}
      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No tasks found. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: { id: string; title: string; description?: string; status: string; priority: string; dueDate: string | null; assigneeId?: string | null; creatorId?: string; assignee: { id: string; name: string } | null; _count: { comments: number } }) => (
            <Card
              key={task.id}
              className={`border-l-4 ${getPriorityBorderColor(task.priority)} transition-all duration-200 ${
                isOverdue(task.dueDate, task.status) ? "border-l-red-500 bg-red-50/50" : ""
              } ${task.status === "DONE" ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold ${
                        task.status === "DONE" ? "line-through text-gray-400" : "text-gray-900"
                      }`}>
                        {task.title}
                      </h3>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                        {task.assignee?.name || "Unassigned"}
                      </span>
                      {task.dueDate && (
                        <span className={`font-medium ${
                          isOverdue(task.dueDate, task.status)
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                      {task._count.comments > 0 && (
                        <span>{task._count.comments} comments</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <NativeSelect
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      options={statuses.map((s) => ({ value: s, label: statusLabel(s) }))}
                      className="w-[140px] h-8 text-xs"
                      disabled={!canEditTask(task)}
                      title={!canEditTask(task) ? "You can only update tasks assigned to you" : undefined}
                    />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
