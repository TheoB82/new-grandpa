import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseServerClient";

export const runtime = "nodejs";

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="el"><head><meta charset="utf-8" /><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;background:#f4ede4;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
  <div style="max-width:420px;text-align:center;background:#fff;border:1px solid #d9b08c;border-radius:16px;padding:36px 28px;">
    <h1 style="margin:0 0 12px;color:#3e2c18;font-size:22px;">${title}</h1>
    <p style="margin:0;color:#5c4321;font-size:15px;line-height:1.5;">${body}</p>
    <a href="https://www.grandpatassos.com" style="display:inline-block;margin-top:20px;color:#8c5e3c;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;">← Επιστροφή στο grandpatassos.com</a>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return new NextResponse(page("Μη έγκυρος σύνδεσμος", "Ο σύνδεσμος διαγραφής δεν είναι έγκυρος."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return new NextResponse(page("Κάτι πήγε στραβά", "Δοκίμασε ξανά αργότερα ή στείλε μας email."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(page("Έγινες διαγραφή", "Δεν θα λαμβάνεις άλλα email για νέες συνταγές. Λυπόμαστε που φεύγεις!"), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
