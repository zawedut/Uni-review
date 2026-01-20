'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

// กำหนด Type ของข้อมูล
interface University {
    id: string
    name_th: string
    type: string
}

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [universities, setUniversities] = useState<University[]>([])

    // Form State
    const [nameTh, setNameTh] = useState('')
    const [type, setType] = useState('Public')

    const router = useRouter()
    const supabase = createClient()

    // 1. เช็คสิทธิ์ Admin และโหลดข้อมูลเก่า
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
            setLoading(false)
        }
        init()
    }, [router, supabase])

    // ฟังก์ชันดึงรายชื่อมหาลัย
    const fetchUniversities = async () => {
        const { data } = await supabase.from('universities').select('*').order('created_at', { ascending: false })
        if (data) setUniversities(data)
    }

    // 2. ฟังก์ชันเพิ่มข้อมูล (Create)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('universities')
            .insert([{ name_th: nameTh, type: type }])

        if (error) {
            alert('Error: ' + error.message)
        } else {
            // alert('เพิ่มข้อมูลสำเร็จ!') // ตัด alert ออกเพื่อความ flow
            setNameTh('') // ล้างฟอร์ม
            fetchUniversities() // โหลดข้อมูลใหม่มาโชว์ทันที
        }
        setLoading(false)
    }

    // 3. ฟังก์ชันลบข้อมูล (Delete)
    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันจะลบ? คณะและสาขาข้างในจะหายหมดเลยนะ!')) return

        const { error } = await supabase.from('universities').delete().eq('id', id)
        if (!error) fetchUniversities()
    }

    if (loading) return <div className="p-10 text-center">กำลังตรวจสอบข้อมูล...</div>
    if (!isAdmin) return null

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard 🛡️</h1>
                <Button variant="outline" onClick={() => router.push('/')}>กลับหน้าบ้าน</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ส่วนฟอร์มเพิ่มข้อมูล */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>เพิ่มมหาวิทยาลัย</CardTitle>
                        <CardDescription>ใส่ข้อมูลเบื้องต้น</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>ชื่อมหาวิทยาลัย</Label>
                                <Input
                                    placeholder="เช่น ม.เกษตรศาสตร์"
                                    value={nameTh}
                                    onChange={(e) => setNameTh(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ประเภท</Label>
                                <select
                                    className="w-full p-2 text-sm border rounded-md bg-background"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="Public">รัฐบาล</option>
                                    <option value="Private">เอกชน</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ส่วนแสดงรายการ */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>รายชื่อทั้งหมด ({universities.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {universities.map((uni) => (
                                <div key={uni.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h3 className="font-semibold text-lg">{uni.name_th}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${uni.type === 'Public' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {uni.type === 'Public' ? 'รัฐบาล' : 'เอกชน'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* ✅ แก้ไขตรงนี้: เชื่อมปุ่มให้ไปหน้าจัดการคณะ */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/university/${uni.id}`)}
                                        >
                                            จัดการคณะ 👉
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(uni.id)}
                                        >
                                            ลบ
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {universities.length === 0 && <p className="text-center text-gray-500 py-4">ยังไม่มีข้อมูล</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}