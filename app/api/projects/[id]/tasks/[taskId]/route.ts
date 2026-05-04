import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { updateTaskSchema } from "@/lib/validators/task";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { requireProjectMember, requireProjectAdmin } from "@/lib/auth/rbac";
import { TaskStatus, TaskPriority, Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id, taskId } = await params;

    await requireProjectMember(user.id, id);

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id, taskId } = await params;

    const membership = await requireProjectMember(user.id, id);

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: id },
    });

    if (!task) {
      throw new Error("NOT_FOUND");
    }

    // Members can only edit tasks assigned to them or created by them
    if (
      membership.role !== Role.ADMIN &&
      task.assigneeId !== user.id &&
      task.creatorId !== user.id
    ) {
      throw new Error("NOT_AN_ADMIN");
    }

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Field-level authorization for non-admin members
    if (membership.role !== Role.ADMIN) {
      const adminOnlyFields = ["assigneeId", "priority", "title", "dueDate"] as const;
      const attemptedAdminFields = adminOnlyFields.filter(
        (field) => data[field] !== undefined
      );
      if (attemptedAdminFields.length > 0) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: `Only admins can update: ${attemptedAdminFields.join(", ")}` } },
          { status: 403 }
        );
      }
    }

    // Validate assignee is a project member
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

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as TaskStatus }),
        ...(data.priority !== undefined && { priority: data.priority as TaskPriority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id, taskId } = await params;

    await requireProjectAdmin(user.id, id);

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: id },
    });

    if (!task) {
      throw new Error("NOT_FOUND");
    }

    await prisma.task.delete({ where: { id: taskId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
