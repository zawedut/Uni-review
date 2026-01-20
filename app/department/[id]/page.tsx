'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, GraduationCap } from 'lucide-react'

export default function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [dept, setDept] = useState<any>(null)
    const [programs, setPrograms] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // ดึงชื่อสาขา
            const { data: deptData } = await supabase.from('departments').select('name_th, faculties(name_th, universities(name_th))').eq('id', id).single()
            setDept(deptData)

            // ดึงหลักสูตร
            const { data: progData } = await supabase
                .from('programs')
                .select('*') // อนาคตเราจะ Join เอาคะแนนรีวิวเฉลี่ยมาด้วยตรงนี้
                .eq('department_id', id)

            if (progData) setPrograms(progData)
        }
        fetchData()
    }, [id])

    if (!dept) return <div className="p-10">Loading...</div>

    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-4">
                {dept.faculties?.universities?.name_th} {'>'} {dept.faculties?.name_th}
            </div>

            <h1 className="text-3xl font-bold mb-8">{dept.name_th}</h1>

            <div className="space-y-4">
                {programs.map((prog) => (
                    <Link href={`/program/${prog.id}`} key={prog.id}>
                        <Card className="hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md mb-4">
                            <CardContent className="p-6 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{prog.name_th}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{prog.degree_type}</span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{prog.campus}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {/* เดี๋ยวเราจะมาทำคะแนนจริงตรงนี้ */}
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span>0.0</span>
                                        <span className="text-gray-400 text-sm font-normal">(0 รีวิว)</span>
                                    </div>
                                    <Button size="sm" className="mt-2" variant="secondary">อ่านรีวิว</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}