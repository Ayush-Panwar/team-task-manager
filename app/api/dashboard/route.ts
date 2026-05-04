import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { TaskStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSessionUser(auth);

    // Get all projects the user is a member of
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    // Get task stats
    const [totalTasks, todoTasks, inProgressTasks, inReviewTasks, doneTasks, overdueTasks] =
      await Promise.all([
        prisma.task.count({
          where: { projectId: { in: projectIds } },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: TaskStatus.TODO },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: TaskStatus.IN_PROGRESS },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: TaskStatus.IN_REVIEW },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, status: TaskStatus.DONE },
        }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            dueDate: { lt: new Date() },
            status: { not: TaskStatus.DONE },
          },
        }),
      ]);

    // My assigned tasks (not done, ordered by due date)
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: TaskStatus.DONE },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 10,
    });

    // Recent tasks across all projects
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // Project summaries using efficient count queries
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    const doneCounts = await prisma.task.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: projectIds },
        status: TaskStatus.DONE,
      },
      _count: { id: true },
    });

    const doneCountMap = new Map(
      doneCounts.map((d) => [d.projectId, d._count.id])
    );

    const projectSummaries = projects.map((p) => {
      const total = p._count.tasks;
      const done = doneCountMap.get(p.id) || 0;
      return {
        id: p.id,
        name: p.name,
        totalTasks: total,
        completedTasks: done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        memberCount: p._count.members,
      };
    });

    return NextResponse.json({
      stats: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueTasks,
        totalProjects: projectIds.length,
      },
      myTasks,
      recentTasks,
      projectSummaries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
