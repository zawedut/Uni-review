'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Building2, BookOpen } from 'lucide-react'

// Type สำหรับข้อมูลที่ Join ตารางมา
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
    const [uni, setUni] = useState<any>(null)
    const [faculties, setFaculties] = useState<Faculty[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // 1. ดึงข้อมูลมหาลัย
            const { data: uniData } = await supabase.from('universities').select('*').eq('id', id).single()
            setUni(uniData)

            // 2. ดึงคณะ และ Join เอาสาขา (Departments) มาด้วยเลย (Supabase ทำได้!)
            const { data: facData } = await supabase
                .from('faculties')
                .select(`
          id, 
          name_th,
          departments ( id, name_th )
        `)
                .eq('university_id', id)
                .order('name_th') // เรียงตามชื่อคณะ

            if (facData) setFaculties(facData as any)
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>
    if (!uni) return <div className="p-10 text-center">ไม่พบข้อมูลมหาวิทยาลัย</div>

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header มหาลัย */}
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto px-4 py-10 flex items-center gap-6">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border-2 border-indigo-100">
                        {/* ถ้ามี Logo ใส่ตรงนี้ */}
                        <Building2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${uni.type === 'Public' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {uni.type === 'Public' ? 'รัฐบาล' : 'เอกชน'}
                        </span>
                        <h1 className="text-3xl font-bold mt-2">{uni.name_th}</h1>
                        <p className="text-gray-500">เลือกคณะและสาขาที่คุณสนใจเพื่อดูรีวิว</p>
                    </div>
                </div>
            </div>

            {/* รายชื่อคณะและสาขา */}
            <div className="container mx-auto px-4 py-10">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" /> คณะที่เปิดสอน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {faculties.map((fac) => (
                        <Card key={fac.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="bg-slate-50 border-b pb-3">
                                <CardTitle className="text-lg text-slate-800">{fac.name_th}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="space-y-2">
                                    {fac.departments.map((dept) => (
                                        <li key={dept.id}>
                                            {/* ลิงก์ไปหน้าสาขา เพื่อดูหลักสูตร */}
                                            <Link href={`/department/${dept.id}`} className="group flex justify-between items-center text-gray-600 hover:text-indigo-600 hover:pl-1 transition-all">
                                                <span>• {dept.name_th}</span>
                                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                            </Link>
                                        </li>
                                    ))}
                                    {fac.departments.length === 0 && <li className="text-sm text-gray-400">ยังไม่มีข้อมูลสาขา</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}