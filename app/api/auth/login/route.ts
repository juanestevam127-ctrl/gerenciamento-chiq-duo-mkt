import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'juanestevam19@outlook.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Juan19022003@#';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const submittedEmail = (email || '').trim();
        const submittedPassword = (password || '').trim();

        const targetEmail = ADMIN_EMAIL.trim();
        const targetPassword = ADMIN_PASSWORD.trim();

        // Debug logging with more detail
        console.log('--- LOGIN DEBUG ---');
        console.log('Submitted:', {
            email: submittedEmail,
            emailLen: submittedEmail.length,
            passLen: submittedPassword.length
        });
        console.log('Target:', {
            email: targetEmail,
            emailLen: targetEmail.length,
            passLen: targetPassword.length
        });

        const emailMatch = submittedEmail === targetEmail;
        const passwordMatch = submittedPassword === targetPassword;

        console.log('Results:', { emailMatch, passwordMatch });
        console.log('-------------------');

        // Simple authentication check - DISABLING AS REQUESTED
        // if (emailMatch && passwordMatch) {
        // Set a simple session cookie
        const cookieStore = await cookies();
        cookieStore.set('session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return NextResponse.json({ success: true });
        // }

        return NextResponse.json(
            { error: 'Credenciais inválidas' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao processar login' },
            { status: 500 }
        );
    }
}
