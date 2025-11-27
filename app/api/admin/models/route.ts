import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Simple helper: check for admin_session cookie
function requireAdmin(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  return !!session;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { data, error } = await supabase
    .from("models")
    .select("id,name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Error fetching models" }, { status: 500 });
  }

  return NextResponse.json({ models: data });
}
