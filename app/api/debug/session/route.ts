import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    console.log('[debug][session] getServerSession result:', session);
    return NextResponse.json({ ok: true, session });
  } catch (err: any) {
    console.error('[debug][session] error', err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
