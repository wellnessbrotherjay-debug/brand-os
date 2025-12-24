import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    console.log("[API] Mocking WX Login for code:", body.code);

    // Return a mock user token
    return NextResponse.json({
        data: {
            user: {
                id: "mock-user-id",
                name: "Test User",
                email: "test@exequte.cn",
                avatar: "https://via.placeholder.com/150"
            },
            auth_token: {
                auth_token: "mock-jwt-token-xyz-123",
                expires: Date.now() + 1000000000
            }
        }
    });
}
