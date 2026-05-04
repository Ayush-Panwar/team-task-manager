import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { updateProjectSchema } from "@/lib/validators/project";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { requireProjectMember, requireProjectAdmin } from "@/lib/auth/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectMember(user.id, id);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!project) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectAdmin(user.id, id);

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectAdmin(user.id, id);

    await prisma.project.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
