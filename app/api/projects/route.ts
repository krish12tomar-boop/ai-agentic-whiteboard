import { db, projects } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!user || !userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const useEmail = user.primaryEmailAddress?.emailAddress;
        const result = await db
            .select()
            .from(projects)
            .where(eq(projects.userEmail, userEmail));

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { projectName, projectId } = await req.json();
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!projectId || !projectName || !userEmail) {
            return NextResponse.json({ error: "Project information missing" }, { status: 400 });
        }

        const result = await db.insert(projects).values({
            projectId,
            projectName,
            userEmail,
        }).returning();

        return NextResponse.json(result[0]);
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}