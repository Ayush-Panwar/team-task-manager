import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const issues = error.issues || [];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: issues.map((e: any) => ({
            field: (e.path || []).join("."),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "NOT_AUTHENTICATED":
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
          { status: 401 }
        );
      case "NOT_A_MEMBER":
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Not a member of this project" } },
          { status: 403 }
        );
      case "NOT_AN_ADMIN":
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Admin access required" } },
          { status: 403 }
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Resource not found" } },
          { status: 404 }
        );
      case "CONFLICT":
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "Resource already exists" } },
          { status: 409 }
        );
    }
  }

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSessionUser(authFn: any) {
  const session = await authFn();
  if (!session?.user?.id) {
    throw new Error("NOT_AUTHENTICATED");
  }
  return session.user as { id: string; name: string; email: string };
}
