'use client'

import { createClient } from '@/utils/supabase/client' // ตรวจสอบ path ให้ถูกนะ
import { Button } from '@/components/ui/button' // ใช้ปุ่มสวยๆ จาก shadcn
import { FcGoogle } from "react-icons/fc"; // (ถ้าลง react-icons แล้ว) หรือใช้ text ธรรมดาก็ได้

export default function LoginPage() {

    const handleGoogleLogin = async () => {
        const supabase = createClient()

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // พอล็อกอินเสร็จ ให้เด้งกลับมาที่ localhost ของเรา
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
    }

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-lg border">
                <h1 className="text-2xl font-bold">เข้าสู่ระบบ / สมัครสมาชิก</h1>
                <p className="text-gray-500">รวมรีวิวมหาวิทยาลัยที่ดีที่สุดในไทย</p>

                <Button
                    onClick={handleGoogleLogin}
                    className="w-full flex gap-2 items-center justify-center"
                    variant="outline"
                >
                    {/* ถ้าไม่มี icon ให้ลบบรรทัด FcGoogle ทิ้ง */}
                    <span>Sign in with Google</span>
                </Button>
            </div>
        </div>
    )
}