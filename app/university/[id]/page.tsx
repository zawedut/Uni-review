'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Building2, BookOpen, ArrowLeft } from 'lucide-react'

interface Department {
    id: string
    name_th: string
}

interface Faculty {
    id: string
    name_th: string
    departments: Department[]
}

export default function UniversityPublicPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [uni, setUni] = useState<any>(null)
    const [faculties, setFaculties] = useState<Faculty[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: uniData } = await supabase.from('universities').select('*').eq('id', id).single()
            setUni(uniData)

            const { data: facData } = await supabase
                .from('faculties')
                .select(`id, name_th, departments ( id, name_th )`)
                .eq('university_id', id)
                .order('name_th')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (facData) setFaculties(facData as any)
            setLoading(false)
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                        <div className="h-8 w-64 bg-gray-200 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-lg" />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!uni) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ไม่พบมหาวิทยาลัย</p>
                    <Link href="/" className="text-blue-600 hover:underline">กลับหน้าหลัก</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <section className="pt-20 pb-6 md:pt-24 md:pb-8 bg-white border-b">
                <div className="container mx-auto px-4">
                    <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                    </Link>

                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            {uni.logo_url ? (
                                <img src={uni.logo_url} alt="" className="w-12 h-12 object-contain" />
                            ) : (
                                <Building2 className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <span className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${uni.type === 'Public'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                                }`}>
                                {uni.type === 'Public' ? 'มหาวิทยาลัยรัฐบาล' : 'มหาวิทยาลัยเอกชน'}
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{uni.name_th}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {faculties.length} คณะ • {faculties.reduce((acc, f) => acc + f.departments.length, 0)} สาขา
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Faculties */}
            <section className="py-6 md:py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">คณะที่เปิดสอน</h2>

                    {faculties.length === 0 ? (
                        <div className="text-center py-16">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มีข้อมูลคณะ</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {faculties.map((fac) => (
                                <Card key={fac.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{fac.name_th}</h3>
                                                <span className="text-xs text-gray-500">{fac.departments.length} สาขา</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-1">
                                            {fac.departments.map((dept) => (
                                                <li key={dept.id}>
                                                    <Link
                                                        href={`/department/${dept.id}`}
                                                        className="flex items-center justify-between py-2 px-2 -mx-2 rounded text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
                                                    >
                                                        <span>{dept.name_th}</span>
                                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                    </Link>
                                                </li>
                                            ))}
                                            {fac.departments.length === 0 && (
                                                <li className="text-sm text-gray-400 py-2">ยังไม่มีข้อมูลสาขา</li>
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}