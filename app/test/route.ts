import { NextResponse } from "next/server";
import slugify from "@/utils/slugify";

export function GET() {
  const title = "Christmas Orange Liqueur";
  return NextResponse.json({
    slug: slugify(title),
  });
}
