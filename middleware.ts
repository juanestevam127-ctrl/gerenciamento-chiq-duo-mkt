import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const authCookie = request.cookies.get('chiquinho_auth')?.value;

    // Se estiver logado e tentar acessar /login, manda para /dashboard
    if (pathname === '/login') {
        if (authCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Se for a raiz '/', redireciona para dashboard (se logado) ou login (se não)
    if (pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = authCookie ? '/dashboard' : '/login';
        return NextResponse.redirect(url);
    }

    // Rotas protegidas da aplicação
    const protectedPaths = ['/dashboard', '/clientes', '/conteudos', '/postagens', '/configuracoes'];
    const isProtected = protectedPaths.some(p => pathname.startsWith(p));

    if (isProtected && !authCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes handle their own auth or public webhooks)
         * - public images/assets
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
