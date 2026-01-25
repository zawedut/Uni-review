'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { GraduationCap, LogOut, Settings, Menu, X } from 'lucide-react'

export default function Navbar() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if (profile?.role === 'admin') setIsAdmin(true)
            }
        }
        checkUser()

        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-sm border-b' : 'bg-white/95 backdrop-blur-sm border-b'
            }`}>
            <div className="container mx-auto px-4">
                <div className="h-16 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">Buddy Review</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAdmin && (
                            <Link href="/admin">
                                <Button variant="ghost" size="sm" className="text-gray-600">
                                    <Settings className="w-4 h-4 mr-1" />
                                    จัดการระบบ
                                </Button>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={user.user_metadata?.avatar_url}
                                        alt=""
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {user.user_metadata?.full_name?.split(' ')[0]}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button size="sm">เข้าสู่ระบบ</Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 -mr-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6 text-gray-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <div className="space-y-3">
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 px-2 py-2 text-gray-600 rounded-lg hover:bg-gray-50"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    จัดการระบบ
                                </Link>
                            )}

                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-2 py-2">
                                        <img
                                            src={user.user_metadata?.avatar_url}
                                            alt=""
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {user.user_metadata?.full_name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-2 py-2 text-red-600 rounded-lg hover:bg-red-50 w-full text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        ออกจากระบบ
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Button className="w-full">เข้าสู่ระบบ</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
