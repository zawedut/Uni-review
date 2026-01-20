'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Trash2 } from 'lucide-react'

export default function ManageDepartments({ params }: { params: Promise<{ id: string }> }) {
    const { id: facultyId } = use(params) // ใช้ use() แกะ Promise
    const [facultyName, setFacultyName] = useState('Loading...')
    const [departments, setDepartments] = useState<any[]>([])
    const [newDept, setNewDept] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // 1. ดึงชื่อคณะ
            const { data: fac } = await supabase
                .from('faculties')
                .select('name_th, university_id') // ดึง university_id ไว้เผื่อกด back
                .eq('id', facultyId)
                .single()

            if (fac) setFacultyName(fac.name_th)

            // 2. ดึงรายชื่อสาขา
            fetchDepartments()
        }
        fetchData()
    }, [facultyId])

    const fetchDepartments = async () => {
        const { data } = await supabase
            .from('departments')
            .select('*')
            .eq('faculty_id', facultyId)
            .order('created_at', { ascending: true })

        if (data) setDepartments(data)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDept.trim()) return

        setLoading(true)
        const { error } = await supabase
            .from('departments')
            .insert([{
                faculty_id: facultyId,
                name_th: newDept
            }])

        if (!error) {
            setNewDept('')
            fetchDepartments()
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ลบสาขานี้? หลักสูตรและรีวิวข้างในจะหายหมดนะ!')) return
        const { error } = await supabase.from('departments').delete().eq('id', id)
        if (!error) fetchDepartments()
    }

    return (
        <div className="container mx-auto py-10 pt-24 max-w-4xl px-4">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับไปหน้าคณะ
            </Button>

            <div className="mb-6">
                <p className="text-sm text-gray-500">จัดการสาขาในสังกัด</p>
                <h1 className="text-3xl font-bold text-slate-800">{facultyName}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ฟอร์มเพิ่มสาขา */}
                <Card className="h-fit border-indigo-100 shadow-sm">
                    <CardHeader>
                        <CardTitle>เพิ่มสาขาใหม่ 🌿</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <Input
                                placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
                                value={newDept}
                                onChange={(e) => setNewDept(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : 'เพิ่มสาขา +'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* รายชื่อสาขา */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>รายชื่อสาขา ({departments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <div key={dept.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                    <span className="font-medium">{dept.name_th}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            // เดี๋ยวเราจะมาทำ Level 4 (หลักสูตร) ต่อ
                                            onClick={() => router.push(`/admin/department/${dept.id}`)}
                                        >
                                            จัดการหลักสูตร 🎓
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(dept.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {departments.length === 0 && <p className="text-center py-8 text-gray-400">ยังไม่มีสาขาเลย...</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}