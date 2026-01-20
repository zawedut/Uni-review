import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // ล็อกอินเสร็จให้กลับไปหน้าแรก /
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        // แลกเปลี่ยน code เป็น session ของ user
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // ล็อกอินสำเร็จ -> กลับไปหน้าแรก
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // ถ้า error ให้เด้งไปหน้า error
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
