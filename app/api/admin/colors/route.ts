import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkPassword(password: string | null) {
  return password === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("colors")
    .select("id,name_en")
    .order("name_en");

  if (error) {
    return NextResponse.json({ error: "Error fetching colors" }, { status: 500 });
  }

  return NextResponse.json({ colors: data });
}
