'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'

export default function LoginPage() {
    const handleGoogleLogin = async () => {
        const supabase = createClient()

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-sm">
                <CardContent className="p-6">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 mb-3">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Mind Review</h1>
                        <p className="text-sm text-gray-500 mt-1">เพื่อเขียนรีวิวและแชร์ประสบการณ์</p>
                    </div>

                    {/* Google Login */}
                    <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full h-11 gap-3"
                    >
                        <FcGoogle className="w-5 h-5" />
                        เข้าสู่ระบบด้วย Google
                    </Button>

                    {/* Back Link */}
                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 inline-flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            กลับหน้าหลัก
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}