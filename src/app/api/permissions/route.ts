import { NextResponse } from "next/server";
import type { PermissionKey, RoleKey } from "@prisma/client";
import { PERMISSION_KEYS } from "@/lib/domain/enums";
import { requirePermission } from "@/lib/auth/authorize";
import { errorResponse } from "@/lib/http";

const matrix: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: [...PERMISSION_KEYS],
  COMPANY_ADMIN: [...PERMISSION_KEYS],
  DEPARTMENT_ADMIN: ["READ", "CREATE", "EDIT", "APPROVE", "MANAGE_BRANCH", "MANAGE_DECISIONS"],
  MANAGER: ["READ", "CREATE", "EDIT", "APPROVE"],
  EMPLOYEE: ["READ", "CREATE"],
};

export async function GET() {
  try {
    await requirePermission("MANAGE_USERS");
    return NextResponse.json({ roles: matrix });
  } catch (error) {
    return errorResponse(error);
  }
}
