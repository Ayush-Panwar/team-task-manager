import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { createTaskSchema } from "@/lib/validators/task";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { requireProjectMember } from "@/lib/auth/rbac";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectMember(user.id, id);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const overdue = searchParams.get("overdue");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // Validate enum query params
    const validStatuses = Object.values(TaskStatus) as string[];
    const validPriorities = Object.values(TaskPriority) as string[];

    if (statusParam && !validStatuses.includes(statusParam)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `Invalid status value. Must be one of: ${validStatuses.join(", ")}` } },
        { status: 400 }
      );
    }

    if (priorityParam && !validPriorities.includes(priorityParam)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `Invalid priority value. Must be one of: ${validPriorities.join(", ")}` } },
        { status: 400 }
      );
    }

    const status = statusParam as TaskStatus | null;
    const priority = priorityParam as TaskPriority | null;

    const where: Record<string, unknown> = { projectId: id };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: TaskStatus.DONE };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectMember(user.id, id);

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    // If assigning to someone, verify they are a project member
    if (data.assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: data.assigneeId, projectId: id } },
      });
      if (!isMember) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Assignee is not a project member" } },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: (data.status as TaskStatus) || TaskStatus.TODO,
        priority: (data.priority as TaskPriority) || TaskPriority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId || null,
        creatorId: user.id,
        projectId: id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
