import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth-options";
import { updateMemberRoleSchema } from "@/lib/validators/project";
import { handleApiError, getSessionUser } from "@/lib/api/error-handler";
import { requireProjectAdmin } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id, memberId } = await params;

    await requireProjectAdmin(user.id, id);

    const body = await request.json();
    const data = updateMemberRoleSchema.parse(body);

    // If changing role from ADMIN to MEMBER, check if this is the last admin
    if (data.role === Role.MEMBER) {
      const currentMember = await prisma.projectMember.findUnique({
        where: { id: memberId },
      });

      if (currentMember?.role === Role.ADMIN) {
        const adminCount = await prisma.projectMember.count({
          where: { projectId: id, role: Role.ADMIN },
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            { error: { code: "BAD_REQUEST", message: "Cannot remove the last admin from a project" } },
            { status: 400 }
          );
        }
      }
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: data.role as Role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getSessionUser(auth);
    const { id, memberId } = await params;

    await requireProjectAdmin(user.id, id);

    // Check if the member being removed is an admin
    const memberToDelete = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (memberToDelete?.role === Role.ADMIN) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: id, role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Cannot remove the last admin from a project" } },
          { status: 400 }
        );
      }
    }

    await prisma.projectMember.delete({ where: { id: memberId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
