'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea' // อย่าลืมลง textarea หรือใช้ input แทนก็ได้
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // ถ้ายังไม่ลง Shadcn Select ให้ใช้ html select ธรรมดาได้
import { ChevronLeft, Trash2, GraduationCap } from 'lucide-react'

export default function ManagePrograms({ params }: { params: Promise<{ id: string }> }) {
    const { id: deptId } = use(params) // ใช้ use() แกะ Promise ตาม Next.js 16
    const [deptName, setDeptName] = useState('Loading...')
    const [programs, setPrograms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Form State
    const [nameTh, setNameTh] = useState('')
    const [degree, setDegree] = useState('ปริญญาตรี')
    const [campus, setCampus] = useState('บางเขน')

    const router = useRouter()
    const supabase = createClient()

    // ฟังก์ชันทดสอบดึงคณะทั้งหมด (ไม่ filter university_id)
    const fetchFaculties = async () => {
        // 👇 ลองดึงมาทั้งหมดเลย (ลบบรรทัด .eq ทิ้งชั่วคราว)
        const { data, error } = await supabase
            .from('faculties')
            .select('*')
            // .eq('university_id', universityId) <--- คอมเมนต์บรรทัดนี้ไว้ก่อน
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Error:", error)
        } else {
            console.log("Data มาแล้ว:", data) // ดูใน Console ว่ามาไหม
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            // 1. ดึงชื่อสาขา/ภาควิชา
            const { data: dept } = await supabase
                .from('departments')
                .select('name_th, faculty_id')
                .eq('id', deptId)
                .single()

            if (dept) setDeptName(dept.name_th)
            fetchPrograms()

            // 🧪 ทดสอบดึงคณะทั้งหมด
            fetchFaculties()
        }
        fetchData()
    }, [deptId])

    const fetchPrograms = async () => {
        const { data } = await supabase
            .from('programs')
            .select('*')
            .eq('department_id', deptId)
            .order('created_at', { ascending: true })
        if (data) setPrograms(data)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nameTh.trim()) return

        setLoading(true)
        const { error } = await supabase.from('programs').insert([{
            department_id: deptId,
            name_th: nameTh,
            degree_type: degree,
            campus: campus
        }])

        if (!error) {
            setNameTh('')
            fetchPrograms()
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันลบหลักสูตรนี้? รีวิวทั้งหมดจะหายไปด้วยนะ!')) return
        const { error } = await supabase.from('programs').delete().eq('id', id)
        if (!error) fetchPrograms()
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับไปหน้าสาขา
            </Button>

            <div className="mb-6">
                <p className="text-sm text-gray-500">จัดการหลักสูตรของ</p>
                <h1 className="text-3xl font-bold text-slate-800">{deptName}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ฟอร์มเพิ่มหลักสูตร */}
                <Card className="h-fit shadow-md border-indigo-100">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle>เพิ่มหลักสูตรใหม่ 🎓</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">ชื่อหลักสูตร</label>
                                <Input
                                    placeholder="เช่น วศ.บ. คอมพิวเตอร์ (ภาคปกติ)"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-500">ระดับ</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm"
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                    >
                                        <option>ปริญญาตรี</option>
                                        <option>ปริญญาโท</option>
                                        <option>ปริญญาเอก</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">วิทยาเขต</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm"
                                        value={campus}
                                        onChange={(e) => setCampus(e.target.value)}
                                    >
                                        <option>บางเขน</option>
                                        <option>กำแพงแสน</option>
                                        <option>ศรีราชา</option>
                                        <option>สกลนคร</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'บันทึก...' : 'เพิ่มหลักสูตร +'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* รายชื่อหลักสูตร */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>หลักสูตรที่มี ({programs.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {programs.map((prog) => (
                                <div key={prog.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:shadow-sm transition-all bg-white">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{prog.name_th}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">{prog.degree_type}</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">{prog.campus}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(prog.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {programs.length === 0 && <div className="text-center py-10 text-gray-400">ยังไม่มีหลักสูตร... เพิ่มเลย!</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}