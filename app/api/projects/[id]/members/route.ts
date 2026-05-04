import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { addMemberSchema } from "@/lib/validators/project";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { requireProjectAdmin, requireProjectMember } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id } = await params;

    await requireProjectMember(user.id, id);

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(members);
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

    await requireProjectAdmin(user.id, id);

    const body = await request.json();
    const data = addMemberSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Could not add member. Check the email and try again." } },
        { status: 404 }
      );
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUser.id, projectId: id } },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "User is already a member" } },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: targetUser.id,
        projectId: id,
        role: data.role as Role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
