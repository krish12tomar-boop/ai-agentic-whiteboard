import { db, projects } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, user.id));

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return NextResponse.json({ error: "Invalid project information" }, { status: 400 });
        }

        const { projectId, projectName } = body as Record<string, unknown>;
        if (
            typeof projectId !== "string" ||
            projectId.trim().length === 0 ||
            projectId.length > 36 ||
            typeof projectName !== "string" ||
            projectName.trim().length === 0 ||
            projectName.trim().length > 30
        ) {
            return NextResponse.json({ error: "Invalid project information" }, { status: 400 });
        }

        const result = await db.insert(projects).values({
            projectId: projectId.trim(),
            projectName: projectName.trim(),
            userId: user.id,
        }).returning();

        return NextResponse.json(result[0]);
    } catch {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
