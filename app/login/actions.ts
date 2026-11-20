'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const password = formData.get('password') as string || ''

  // 1. Checagem direta (ADMIN_EMAIL e ADMIN_PASSWORD com fallback seguro)
  const envEmail = (process.env.ADMIN_EMAIL || 'juanestevam19@outlook.com').trim().toLowerCase()
  const envPassword = process.env.ADMIN_PASSWORD || 'Juan19022003@#'

  let isValid = false
  let userName = 'Juan'

  if (email === envEmail && password === envPassword) {
    isValid = true
  }

  // 2. Se não bateu com o .env, consulta a tabela chiquinho_usuarios no Supabase
  if (!isValid) {
    try {
      const { data, error } = await supabase
        .from('chiquinho_usuarios')
        .select('*')
        .ilike('email', email)
        .eq('senha', password)
        .maybeSingle()

      if (!error && data) {
        isValid = true
        userName = data.nome || 'Administrador'
      }
    } catch (err) {
      console.error('Erro ao consultar chiquinho_usuarios:', err)
    }
  }

  if (!isValid) {
    return { error: 'E-mail ou senha incorretos' }
  }

  // 3. Cria a sessão com Cookie seguro (válido por 30 dias)
  const cookieStore = await cookies()
  cookieStore.set('chiquinho_auth', JSON.stringify({ email, name: userName, loggedAt: Date.now() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('chiquinho_auth')
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
