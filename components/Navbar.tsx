'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { GraduationCap, LogOut, Settings, Menu, X, Search, PenLine, BookOpen } from 'lucide-react'

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

    // Trigger global search shortcut
    const triggerSearch = () => {
        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        document.dispatchEvent(event)
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/50' : 'bg-white/90 backdrop-blur-sm border-b border-slate-100'
            }`}>
            <div className="container mx-auto px-4">
                <div className="h-16 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">Buddy Review</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-2">
                        {/* Search Button */}
                        <button
                            onClick={triggerSearch}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                        >
                            <Search className="w-4 h-4" />
                            <span>ค้นหา</span>
                            <kbd className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-400 font-mono">⌘K</kbd>
                        </button>

                        {/* Read Reviews */}
                        <Link href="/reviews">
                            <Button variant="ghost" size="sm" className="text-gray-600 gap-1.5">
                                <BookOpen className="w-4 h-4" />
                                อ่านรีวิว
                            </Button>
                        </Link>

                        {/* Write Review */}
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="text-gray-600 gap-1.5">
                                <PenLine className="w-4 h-4" />
                                เขียนรีวิว
                            </Button>
                        </Link>

                        {isAdmin && (
                            <Link href="/admin">
                                <Button variant="ghost" size="sm" className="text-gray-600 gap-1.5">
                                    <Settings className="w-4 h-4" />
                                    จัดการระบบ
                                </Button>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={user.user_metadata?.avatar_url}
                                        alt=""
                                        className="w-8 h-8 rounded-full ring-2 ring-slate-100"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">
                                        {user.user_metadata?.full_name?.split(' ')[0]}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-500">
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
                                    เข้าสู่ระบบ
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile: Search + Menu */}
                    <div className="md:hidden flex items-center gap-1">
                        <button
                            onClick={triggerSearch}
                            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">หน้าหลัก</span>
                        </Link>

                        <Link
                            href="/reviews"
                            className="flex items-center gap-3 px-3 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">อ่านรีวิว</span>
                        </Link>

                        <Link
                            href="/login"
                            className="flex items-center gap-3 px-3 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <PenLine className="w-5 h-5 text-purple-500" />
                            <span className="font-medium">เขียนรีวิว</span>
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 px-3 py-3 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Settings className="w-5 h-5 text-slate-500" />
                                <span className="font-medium">จัดการระบบ</span>
                            </Link>
                        )}

                        {user ? (
                            <>
                                <div className="flex items-center gap-3 px-3 py-3 border-t border-slate-100 mt-2 pt-3">
                                    <img
                                        src={user.user_metadata?.avatar_url}
                                        alt=""
                                        className="w-9 h-9 rounded-full ring-2 ring-slate-100"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">
                                        {user.user_metadata?.full_name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-3 text-red-500 rounded-xl hover:bg-red-50 w-full text-left transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">ออกจากระบบ</span>
                                </button>
                            </>
                        ) : (
                            <div className="pt-2 px-3">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
                                        เข้าสู่ระบบ
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
