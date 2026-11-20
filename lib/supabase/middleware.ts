import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Checa a sessão simples por cookie
  const authCookie = request.cookies.get('chiquinho_auth')?.value
  let isAuthenticated = !!authCookie

  // 2. Se não achou cookie, checa se ainda há sessão legada do Supabase
  if (!isAuthenticated) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) isAuthenticated = true
    } catch {
      // Ignora erro
    }
  }

  // Proteger todas as rotas exceto /login, /api e rotas estáticas
  if (
    !isAuthenticated &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se o usuário estiver logado e tentar acessar /login, redireciona para o painel
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
  }

  return supabaseResponse
}
