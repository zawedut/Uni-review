'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Star, GraduationCap, Building2, Users, UserCircle } from 'lucide-react'

// --- Helper Component: ดาวสำหรับกดเลือก ---
const StarInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`transition-all hover:scale-110 ${star <= value ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                    <Star className="w-8 h-8 fill-current" />
                </button>
            ))}
        </div>
    </div>
)

export default function ProgramReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [program, setProgram] = useState<any>(null)
    const [reviews, setReviews] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false) // State เปิด/ปิด Modal

    // State สำหรับฟอร์มรีวิว
    const [form, setForm] = useState({ academic: 0, social: 0, facility: 0, comment: '' })
    const [submitting, setSubmitting] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            // 1. เช็ค User
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            // 2. ดึงข้อมูลหลักสูตร
            const { data: prog } = await supabase.from('programs').select('*, departments(name_th)').eq('id', id).single()
            setProgram(prog)

            // 3. ดึงรีวิว + ข้อมูลคนโพสต์ (Join Profiles)
            fetchReviews()
        }
        init()
    }, [id])

    const fetchReviews = async () => {
        const { data } = await supabase
            .from('reviews')
            .select('*, profiles(full_name, avatar_url, email)') // Join เอาชื่อคนโพสต์มาด้วย
            .eq('program_id', id)
            .order('created_at', { ascending: false })

        if (data) setReviews(data)
        setLoading(false)
    }

    // คำนวณคะแนนเฉลี่ย (Stats Calculation)
    const stats = reviews.reduce((acc, r) => ({
        academic: acc.academic + r.rating_academic,
        social: acc.social + r.rating_social,
        facility: acc.facility + r.rating_facility,
        count: acc.count + 1
    }), { academic: 0, social: 0, facility: 0, count: 0 })

    const avg = (val: number) => stats.count === 0 ? 0 : (val / stats.count).toFixed(1)
    const totalAvg = stats.count === 0 ? 0 : ((stats.academic + stats.social + stats.facility) / (stats.count * 3)).toFixed(1)

    // ฟังก์ชันส่งรีวิว
    const handleSubmit = async () => {
        if (!user) return router.push('/login')
        if (form.academic === 0 || form.social === 0 || form.facility === 0) return alert('กรุณาให้คะแนนครบทุกช่อง')

        setSubmitting(true)
        const { error } = await supabase.from('reviews').insert([{
            program_id: id,
            user_id: user.id,
            rating_academic: form.academic,
            rating_social: form.social,
            rating_facility: form.facility,
            comment: form.comment
        }])

        if (!error) {
            setIsOpen(false) // ปิด Modal
            setForm({ academic: 0, social: 0, facility: 0, comment: '' }) // ล้างฟอร์ม
            fetchReviews() // โหลดข้อมูลใหม่ทันที
        } else {
            alert(error.message)
        }
        setSubmitting(false)
    }

    if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b py-10 px-4">
                <div className="container mx-auto max-w-4xl">
                    <span className="text-indigo-600 font-semibold mb-2 block">{program?.departments?.name_th}</span>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{program?.name_th}</h1>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{program?.degree_type}</span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{program?.campus}</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* --- Left Column: Stats Board --- */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-indigo-100 shadow-sm sticky top-24">
                        <CardContent className="pt-6 text-center space-y-6">
                            <div>
                                <div className="text-5xl font-bold text-slate-800 flex justify-center items-center gap-2">
                                    {totalAvg} <Star className="w-8 h-8 text-yellow-400 fill-current" />
                                </div>
                                <p className="text-gray-500 text-sm mt-2">จากทั้งหมด {reviews.length} รีวิว</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> วิชาการ</span>
                                        <span className="font-bold">{avg(stats.academic)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${(Number(avg(stats.academic)) / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> สังคม</span>
                                        <span className="font-bold">{avg(stats.social)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-pink-500" style={{ width: `${(Number(avg(stats.social)) / 5) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> สถานที่</span>
                                        <span className="font-bold">{avg(stats.facility)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(Number(avg(stats.facility)) / 5) * 100}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* ปุ่มเขียนรีวิว (Trigger Modal) */}
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">เขียนรีวิว ✍️</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>เขียนรีวิวหลักสูตรนี้</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                        <div className="flex justify-between gap-4">
                                            <StarInput label="วิชาการ" value={form.academic} onChange={(v) => setForm({ ...form, academic: v })} />
                                            <StarInput label="สังคม" value={form.social} onChange={(v) => setForm({ ...form, social: v })} />
                                            <StarInput label="สถานที่" value={form.facility} onChange={(v) => setForm({ ...form, facility: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">ความคิดเห็นเพิ่มเติม</label>
                                            <Textarea
                                                placeholder="เล่าประสบการณ์ให้รุ่นน้องฟังหน่อย..."
                                                rows={4}
                                                value={form.comment}
                                                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                            />
                                        </div>
                                        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                                            {submitting ? 'กำลังส่ง...' : 'ยืนยันการรีวิว'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                        </CardContent>
                    </Card>
                </div>

                {/* --- Right Column: Review List --- */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold">ความคิดเห็นล่าสุด</h2>

                    {reviews.map((review) => (
                        <Card key={review.id} className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {review.profiles?.avatar_url ? (
                                            <img src={review.profiles.avatar_url} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <UserCircle className="w-10 h-10 text-gray-300" />
                                        )}
                                        <div>
                                            <div className="font-semibold text-sm">{review.profiles?.full_name || 'Anonymous'}</div>
                                            <div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('th-TH')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-indigo-700 font-bold">
                                        <Star className="w-4 h-4 fill-current" /> {review.rating_total?.toFixed(1) || ((review.rating_academic + review.rating_social + review.rating_facility) / 3).toFixed(1)}
                                    </div>
                                </div>

                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    "{review.comment}"
                                </p>

                                <div className="mt-4 flex gap-4 text-xs text-gray-500 border-t pt-3">
                                    <span>📚 วิชาการ: {review.rating_academic}/5</span>
                                    <span>🤝 สังคม: {review.rating_social}/5</span>
                                    <span>🏢 สถานที่: {review.rating_facility}/5</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {reviews.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                            <p className="text-gray-400">ยังไม่มีรีวิว... มาเป็นคนแรกกันเถอะ!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}