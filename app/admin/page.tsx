'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Building2, BookOpen, GraduationCap, MessageSquare, TrendingUp, Users, ChevronRight, Plus, Trash2, Settings, BarChart3, Star } from 'lucide-react'
import Link from 'next/link'

// กำหนด Type ของข้อมูล
interface University {
    id: string
    name_th: string
    type: string
}

interface Stats {
    universities: number
    faculties: number
    departments: number
    programs: number
    reviews: number
}

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color, trend }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any
    label: string
    value: number
    color: string
    trend?: string
}) => (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                    <p className="text-3xl font-black text-slate-900">{value}</p>
                    {trend && (
                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
)

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, href, color }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any
    title: string
    description: string
    href: string
    color: string
}) => (
    <Link href={href}>
        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </CardContent>
        </Card>
    </Link>
)

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [universities, setUniversities] = useState<University[]>([])
    const [stats, setStats] = useState<Stats>({ universities: 0, faculties: 0, departments: 0, programs: 0, reviews: 0 })

    // Form State
    const [nameTh, setNameTh] = useState('')
    const [type, setType] = useState('Public')
    const [formLoading, setFormLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // 1. เช็คสิทธิ์ Admin และโหลดข้อมูลเก่า
    // ฟังก์ชันดึงรายชื่อมหาลัย
    const fetchUniversities = async () => {
        const { data } = await supabase.from('universities').select('*').order('created_at', { ascending: false })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (data) setUniversities(data as any)
    }

    // ฟังก์ชันดึง Statistics
    const fetchStats = async () => {
        const [unis, facs, depts, progs, revs] = await Promise.all([
            supabase.from('universities').select('id', { count: 'exact', head: true }),
            supabase.from('faculties').select('id', { count: 'exact', head: true }),
            supabase.from('departments').select('id', { count: 'exact', head: true }),
            supabase.from('programs').select('id', { count: 'exact', head: true }),
            supabase.from('reviews').select('id', { count: 'exact', head: true }),
        ])

        setStats({
            universities: unis.count || 0,
            faculties: facs.count || 0,
            departments: depts.count || 0,
            programs: progs.count || 0,
            reviews: revs.count || 0,
        })
    }

    useEffect(() => {
        const init = async () => {
            // เช็ค User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            // เช็ค Role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                alert('พื้นที่หวงห้าม! สำหรับผู้ดูแลระบบเท่านั้น')
                return router.push('/')
            }

            setIsAdmin(true)
            fetchUniversities()
            fetchStats()
            setLoading(false)
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, supabase])



    // 2. ฟังก์ชันเพิ่มข้อมูล (Create)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)

        const { error } = await supabase
            .from('universities')
            .insert([{ name_th: nameTh, type: type }])

        if (error) {
            alert('Error: ' + error.message)
        } else {
            setNameTh('')
            fetchUniversities()
            fetchStats()
        }
        setFormLoading(false)
    }

    // 3. ฟังก์ชันลบข้อมูล (Delete)
    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันจะลบ? คณะและสาขาข้างในจะหายหมดเลยนะ!')) return

        const { error } = await supabase.from('universities').delete().eq('id', id)
        if (!error) {
            fetchUniversities()
            fetchStats()
        }
    }

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600">กำลังตรวจสอบสิทธิ์...</p>
            </div>
        </div>
    )
    if (!isAdmin) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-500 mt-2">จัดการข้อมูลมหาวิทยาลัยและรีวิว</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
                        🏠 กลับหน้าบ้าน
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <StatsCard icon={Building2} label="มหาวิทยาลัย" value={stats.universities} color="from-blue-500 to-blue-600" />
                    <StatsCard icon={BookOpen} label="คณะ" value={stats.faculties} color="from-purple-500 to-purple-600" />
                    <StatsCard icon={GraduationCap} label="สาขา" value={stats.departments} color="from-pink-500 to-pink-600" />
                    <StatsCard icon={Star} label="หลักสูตร" value={stats.programs} color="from-amber-500 to-orange-600" />
                    <StatsCard icon={MessageSquare} label="รีวิว" value={stats.reviews} color="from-green-500 to-emerald-600" trend="+12% เดือนนี้" />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <QuickActionCard
                        icon={MessageSquare}
                        title="จัดการรีวิว"
                        description="ดู ลบ หรือจัดการรีวิวทั้งหมด"
                        href="/admin/reviews"
                        color="from-green-500 to-emerald-600"
                    />
                    <QuickActionCard
                        icon={BarChart3}
                        title="สถิติรายละเอียด"
                        description="ดูกราฟและข้อมูลเชิงลึก"
                        href="/admin"
                        color="from-purple-500 to-pink-600"
                    />
                    <QuickActionCard
                        icon={Users}
                        title="จัดการผู้ใช้"
                        description="ดูรายชื่อผู้ใช้งานทั้งหมด"
                        href="/admin"
                        color="from-blue-500 to-cyan-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ส่วนฟอร์มเพิ่มข้อมูล */}
                    <Card className="lg:col-span-1 h-fit border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" />
                                เพิ่มมหาวิทยาลัย
                            </CardTitle>
                            <CardDescription>ใส่ข้อมูลเบื้องต้นของมหาวิทยาลัย</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold">ชื่อมหาวิทยาลัย</Label>
                                    <Input
                                        placeholder="เช่น มหาวิทยาลัยเกษตรศาสตร์"
                                        value={nameTh}
                                        onChange={(e) => setNameTh(e.target.value)}
                                        required
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">ประเภท</Label>
                                    <select
                                        className="w-full p-3 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="Public">🏛️ รัฐบาล</option>
                                        <option value="Private">🏢 เอกชน</option>
                                    </select>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    disabled={formLoading}
                                >
                                    {formLoading ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span>
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5 mr-2" />
                                            เพิ่มมหาวิทยาลัย
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ส่วนแสดงรายการ */}
                    <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    รายชื่อมหาวิทยาลัย
                                </span>
                                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                    {universities.length} แห่ง
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                {universities.map((uni) => (
                                    <div key={uni.id} className="group flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{uni.name_th}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${uni.type === 'Public'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {uni.type === 'Public' ? '🏛️ รัฐบาล' : '🏢 เอกชน'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/university/${uni.id}`)}
                                                className="gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                            >
                                                จัดการคณะ
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(uni.id)}
                                                className="gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {universities.length === 0 && (
                                    <div className="text-center py-12">
                                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">ยังไม่มีข้อมูลมหาวิทยาลัย</p>
                                        <p className="text-sm text-slate-400 mt-1">เริ่มเพิ่มมหาวิทยาลัยแรกของคุณ</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}