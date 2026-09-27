import { describe, expect, it, vi, afterEach } from "vitest";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { errorResponse } from "@/lib/http";

const body = async (response: Response) => response.json() as Promise<{ error: string; fields?: string[] }>;

afterEach(() => vi.restoreAllMocks());

/**
 * The fallback used to be 400 for everything unrecognised, so a fault in this
 * service came back as the caller's mistake and was never written down.
 */
describe("errorResponse", () => {
  it("keeps the answers the routes throw for on purpose", async () => {
    expect(errorResponse(new Error("UNAUTHENTICATED")).status).toBe(401);
    expect(errorResponse(new Error("ACCOUNT_INACTIVE")).status).toBe(403);
    expect(errorResponse(new Error("ORGANIZATION_REQUIRED")).status).toBe(403);
    expect(errorResponse(new Error("FORBIDDEN:role_denied")).status).toBe(403);
    expect(errorResponse(new Error("NOT_FOUND")).status).toBe(404);
    expect(errorResponse(new Error("CONFLICT")).status).toBe(409);
  });

  it("answers a schema violation with 422 and names the fields", async () => {
    const schema = z.object({ title: z.string().min(3), scope: z.enum(["A", "B"]) });
    const failure = schema.safeParse({ title: "x", scope: "Z" });
    expect(failure.success).toBe(false);
    const response = errorResponse(failure.error);
    expect(response.status).toBe(422);
    const payload = await body(response);
    expect(payload.fields).toEqual(expect.arrayContaining(["title", "scope"]));
    expect(payload.error).toContain("title");
  });

  it("maps the store's own refusals rather than calling them bad requests", () => {
    const known = (code: string) => new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "6" });
    expect(errorResponse(known("P2002")).status).toBe(409);
    expect(errorResponse(known("P2025")).status).toBe(404);
    expect(errorResponse(known("P2003")).status).toBe(409);
  });

  it("calls a fault in this service a 500, logs it, and leaks nothing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new TypeError("Cannot read properties of undefined (reading 'branchId')"));
    expect(response.status).toBe(500);
    expect(logged).toHaveBeenCalled();
    const payload = await body(response);
    expect(payload.error).not.toContain("branchId");
    expect(payload.error).not.toContain("undefined");
  });

  it("treats something thrown that is not an Error as a fault too", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(errorResponse("kaputt").status).toBe(500);
  });
});
