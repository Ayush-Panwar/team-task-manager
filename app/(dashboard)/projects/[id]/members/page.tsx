"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMembers, useAddMember, useUpdateMemberRole, useRemoveMember } from "@/hooks/use-members";
import { useProject } from "@/hooks/use-projects";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "sonner";

const roleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: members, isLoading } = useMembers(id);
  const { data: project } = useProject(id);
  const addMember = useAddMember(id);
  const updateRole = useUpdateMemberRole(id);
  const removeMember = useRemoveMember(id);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");

  // Check if current user is admin
  const currentMembership = members?.find(
    (m: { user: { id: string } }) => m.user.id === session?.user?.id
  );
  const isAdmin = currentMembership?.role === "ADMIN";

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addMember.mutateAsync({ email, role });
      toast.success("Member added");
      setEmail("");
      setRole("MEMBER");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member");
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      await updateRole.mutateAsync({ memberId, role: newRole });
      toast.success("Role updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      await removeMember.mutateAsync(memberId);
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {project?.name} - Team Members
      </h1>

      {/* Add Member (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <NativeSelect
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={roleOptions}
                  className="w-[120px]"
                />
              </div>
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending ? "Adding..." : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members?.map((member: { id: string; role: string; user: { id: string; name: string; email: string } }) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-medium">
                    {member.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && member.user.id !== session?.user?.id ? (
                    <>
                      <NativeSelect
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        options={roleOptions}
                        className="w-[120px]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRemove(member.id, member.user.name)}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
