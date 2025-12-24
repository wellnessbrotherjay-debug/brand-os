import { NextResponse } from "next/server";
import { getWelcomeContext } from "@/app/room/[roomId]/tv/context";

type RouteContext = {
  params: { roomId: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getWelcomeContext(params.roomId);
  return NextResponse.json({ context });
}
