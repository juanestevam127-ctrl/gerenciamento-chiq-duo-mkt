import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('chiquinho_auth');

    const response = NextResponse.json({ success: true });
    response.cookies.delete('chiquinho_auth');

    return response;
}
