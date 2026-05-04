"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Task = Record<string, any>;

export function useTasks(projectId: string, params?: Record<string, string>) {
  const searchString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["tasks", projectId, searchString],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/tasks?${searchString}`
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const json = await res.json();
      return json.data;
    },
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

export function useTask(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ["tasks", projectId, taskId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to update task");
      }
      return res.json();
    },
    onMutate: async ({ taskId, data }) => {
      // Cancel all task queries for this project
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // Remove all other filter caches so stale data doesn't leak
      queryClient.removeQueries({
        queryKey: ["tasks", projectId],
        type: "inactive",
      });

      // Snapshot the currently active query
      const activeQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks", projectId],
        type: "active",
      });

      // Optimistically update only the active (visible) query
      activeQueries.forEach(([queryKey]) => {
        queryClient.setQueryData<Task[]>(queryKey, (old) => {
          if (!old) return old;
          return old.map((task: Task) =>
            task.id === taskId ? { ...task, ...data } : task
          );
        });
      });

      return { activeQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.activeQueries) {
        context.activeQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      queryClient.removeQueries({
        queryKey: ["tasks", projectId],
        type: "inactive",
      });

      const activeQueries = queryClient.getQueriesData<Task[]>({
        queryKey: ["tasks", projectId],
        type: "active",
      });

      activeQueries.forEach(([queryKey]) => {
        queryClient.setQueryData<Task[]>(queryKey, (old) => {
          if (!old) return old;
          return old.filter((task: Task) => task.id !== taskId);
        });
      });

      return { activeQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.activeQueries) {
        context.activeQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
