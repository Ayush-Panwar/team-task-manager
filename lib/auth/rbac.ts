import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getProjectMembership(userId: string, projectId: string) {
  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });
}

export async function requireProjectMember(userId: string, projectId: string) {
  const membership = await getProjectMembership(userId, projectId);
  if (!membership) {
    throw new Error("NOT_A_MEMBER");
  }
  return membership;
}

export async function requireProjectAdmin(userId: string, projectId: string) {
  const membership = await requireProjectMember(userId, projectId);
  if (membership.role !== Role.ADMIN) {
    throw new Error("NOT_AN_ADMIN");
  }
  return membership;
}
