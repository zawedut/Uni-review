'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation' // ใช้ของ next/navigation นะ
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Trash2 } from 'lucide-react' // ไอคอนสวยๆ

export default function ManageFaculties({ params }: { params: Promise<{ id: string }> }) {
    const { id: universityId } = use(params) // ใช้ use() แกะ Promise ตาม Next.js 16
    const [uniName, setUniName] = useState('Loading...')
    const [faculties, setFaculties] = useState<any[]>([])
    const [newFaculty, setNewFaculty] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // 1. โหลดข้อมูลเมื่อเข้าหน้าเว็บ
    useEffect(() => {
        if (!universityId) return // ถ้าไม่มี ID ไม่ต้องทำอะไร

        const fetchData = async () => {
            // ดึงชื่อมหาลัยมาโชว์หัวข้อ
            const { data: uni } = await supabase
                .from('universities')
                .select('name_th')
                .eq('id', universityId)
                .single()

            if (uni) setUniName(uni.name_th)

            // ดึงรายการคณะที่มีอยู่แล้ว
            fetchFaculties()
        }
        fetchData()
    }, [universityId]) // dependency ต้องมี universityId

    const fetchFaculties = async () => {
        // 🛡️ กันไฟดูด: ถ้าไม่มี ID หรือ ID สั้นผิดปกติ ให้หยุดทันที ไม่ต้องยิงไป Supabase
        if (!universityId || universityId.length < 10) {
            console.warn("ยังไม่มี University ID หยุดการทำงาน")
            return
        }

        console.log("กำลังดึงข้อมูลด้วย ID:", universityId)

        const { data, error } = await supabase
            .from('faculties')
            .select('*')
            .eq('university_id', universityId) // ต้องแน่ใจว่าบรรทัดนี้ไม่ได้ถูกคอมเมนต์ทิ้งนะ
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Supabase Error:", error) // จะได้เห็น Error เต็มๆ
        } else {
            setFaculties(data || [])
        }
    }

    // 2. ฟังก์ชันเพิ่มคณะ
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFaculty.trim()) return

        setLoading(true)
        const { error } = await supabase
            .from('faculties')
            .insert([{
                university_id: universityId, // ผูก ID มหาลัยอัตโนมัติ
                name_th: newFaculty
            }])

        if (!error) {
            setNewFaculty('')
            fetchFaculties()
        } else {
            alert(error.message)
        }
        setLoading(false)
    }

    // 3. ฟังก์ชันลบคณะ
    const handleDelete = async (id: string) => {
        if (!confirm('ลบคณะนี้? สาขาและหลักสูตรข้างในจะหายหมดเลยนะ!')) return

        const { error } = await supabase.from('faculties').delete().eq('id', id)
        if (!error) fetchFaculties()
    }

    return (
        <div className="container mx-auto py-10 pt-24 max-w-4xl px-4">
            {/* ปุ่มย้อนกลับ */}
            <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับไปหน้ามหาลัย
            </Button>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <p className="text-sm text-gray-500">กำลังจัดการข้อมูลของ</p>
                    <h1 className="text-3xl font-bold text-slate-800">{uniName}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ฝั่งซ้าย: ฟอร์มเพิ่มคณะ */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>สร้างคณะใหม่ 🏗️</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <Input
                                placeholder="เช่น คณะวิศวกรรมศาสตร์"
                                value={newFaculty}
                                onChange={(e) => setNewFaculty(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'กำลังสร้าง...' : 'เพิ่มคณะ +'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ฝั่งขวา: รายรายการคณะ */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>รายชื่อคณะ ({faculties.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {faculties.map((fac) => (
                                <div key={fac.id} className="group flex justify-between items-center p-3 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                                    <span className="font-medium">{fac.name_th}</span>
                                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => router.push(`/admin/faculty/${fac.id}`)} // เพิ่มบรรทัดนี้
                                        >
                                            จัดการสาขา 👉
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100" onClick={() => handleDelete(fac.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {faculties.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    ยังไม่มีข้อมูลคณะเลย... เริ่มสร้างทางซ้ายมือสิ!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}