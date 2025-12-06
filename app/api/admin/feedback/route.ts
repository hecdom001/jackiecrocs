// app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // NEVER expose to client

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const { message, lang, context } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 1) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") ?? null;

    const { error } = await supabase.from("feedback").insert({
      message: message.trim(),
      lang: lang === "en" ? "en" : "es",
      context: context ?? null,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Error inserting feedback:", error);
      return NextResponse.json(
        { error: "Error saving feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in feedback route:", err);
    return NextResponse.json(
      { error: "Error saving feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error loading feedback:", error);
      return NextResponse.json(
        { error: "Error loading feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: data ?? [] });
  } catch (err) {
    console.error("Unexpected error in /api/admin/feedback:", err);
    return NextResponse.json(
      { error: "Unexpected error loading feedback" },
      { status: 500 }
    );
  }
}
