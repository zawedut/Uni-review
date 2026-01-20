'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, GraduationCap, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react'

export default function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [dept, setDept] = useState<any>(null)
    const [programs, setPrograms] = useState<any[]>([])
    const [progStats, setProgStats] = useState<Record<string, { rating: number, count: number }>>({})
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: deptData } = await supabase
                .from('departments')
                .select('name_th, faculties(name_th, id, universities(name_th, id))')
                .eq('id', id)
                .single()
            setDept(deptData)

            const { data: progData } = await supabase
                .from('programs')
                .select('*')
                .eq('department_id', id)

            if (progData) {
                setPrograms(progData)

                // Fetch reviews for these programs
                const programIds = progData.map(p => p.id)
                if (programIds.length > 0) {
                    const { data: reviews } = await supabase
                        .from('reviews')
                        .select('program_id, rating_academic, rating_social, rating_facility')
                        .in('program_id', programIds)

                    if (reviews) {
                        const stats: Record<string, { total: number, count: number }> = {}
                        reviews.forEach(r => {
                            if (!stats[r.program_id]) stats[r.program_id] = { total: 0, count: 0 }
                            const avg = (r.rating_academic + r.rating_social + r.rating_facility) / 3
                            stats[r.program_id].total += avg
                            stats[r.program_id].count += 1
                        })

                        const finalStats: Record<string, { rating: number, count: number }> = {}
                        Object.keys(stats).forEach(pid => {
                            finalStats[pid] = {
                                rating: Number((stats[pid].total / stats[pid].count).toFixed(1)),
                                count: stats[pid].count
                            }
                        })
                        setProgStats(finalStats)
                    }
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-gray-50">
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-48 bg-gray-200 rounded" />
                        <div className="h-8 w-64 bg-gray-200 rounded" />
                        <div className="space-y-3 mt-8">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!dept) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ไม่พบข้อมูลสาขา</p>
                    <Link href="/" className="text-blue-600 hover:underline">กลับหน้าหลัก</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <section className="pt-20 pb-6 md:pt-24 md:pb-8 bg-white border-b">
                <div className="container mx-auto px-4 max-w-3xl">
                    {/* Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-blue-600">หน้าหลัก</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/university/${dept.faculties?.universities?.id}`} className="hover:text-blue-600">
                            {dept.faculties?.universities?.name_th}
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-700 truncate">{dept.faculties?.name_th}</span>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">{dept.name_th}</h1>
                    <p className="text-sm text-gray-500 mt-1">{programs.length} หลักสูตร</p>
                </div>
            </section>

            {/* Programs */}
            <section className="py-6 md:py-8">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">หลักสูตรที่เปิดสอน</h2>

                    {programs.length === 0 ? (
                        <div className="text-center py-16">
                            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มีข้อมูลหลักสูตร</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {programs.map((prog) => (
                                <Link href={`/program/${prog.id}`} key={prog.id}>
                                    <Card className="hover:shadow-md transition-shadow group mb-3">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {prog.name_th}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                                {prog.degree_type}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                                {prog.campus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    {progStats[prog.id] ? (
                                                        <>
                                                            <div className="flex items-center justify-end gap-1 text-amber-500">
                                                                <Star className="w-4 h-4 fill-current" />
                                                                <span className="font-semibold">{progStats[prog.id].rating}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{progStats[prog.id].count} รีวิว</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-end gap-1 text-slate-300">
                                                                <Star className="w-4 h-4" />
                                                                <span className="font-semibold">--</span>
                                                            </div>
                                                            <span className="text-xs text-gray-400">ยังไม่มีรีวิว</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}