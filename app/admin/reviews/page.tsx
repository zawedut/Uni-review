'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Trash2, ArrowLeft, Star, Search, Filter, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Review {
    id: string
    comment: string
    rating_academic: number
    rating_social: number
    rating_facility: number
    created_at: string
    program_id: string
    programs?: {
        name_th: string
        departments?: {
            name_th: string
            faculties?: {
                name_th: string
                universities?: {
                    name_th: string
                }
            }
        }
    }
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            // Check Admin Role
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return router.push('/')
            }

            fetchReviews()
        }
        init()
    }, [router, supabase])

    const fetchReviews = async () => {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                programs (
                    name_th,
                    departments (
                        name_th,
                        faculties (
                            name_th,
                            universities (
                                name_th
                            )
                        )
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching reviews:', error)
        } else if (data) {
            setReviews(data as any)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันที่จะลบรีวิวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id)

        if (error) {
            alert('ลบไม่สำเร็จ: ' + error.message)
        } else {
            setReviews(reviews.filter(r => r.id !== id))
        }
    }

    const filteredReviews = reviews.filter(review =>
        review.comment?.toLowerCase().includes(search.toLowerCase()) ||
        review.programs?.name_th.toLowerCase().includes(search.toLowerCase()) ||
        review.programs?.departments?.faculties?.universities?.name_th.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin')}
                            className="text-slate-500 hover:text-slate-900 mb-2 pl-0"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            จัดการรีวิว
                        </h1>
                        <p className="text-slate-500 mt-1">
                            ตรวจสอบและจัดการรีวิวทั้งหมดในระบบ ({reviews.length})
                        </p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="ค้นหารีวิว, หลักสูตร, หรือมหาวิทยาลัย..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Placeholder for future specific filters */}
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <Filter className="w-4 h-4" />
                        ตัวกรอง
                    </Button>
                </div>

                {/* Reviews List */}
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">ไม่พบรีวิวที่ค้นหา</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <Card key={review.id} className="group hover:shadow-md transition-shadow duration-200 border-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Status Bar / Score */}
                                        <div className="w-full md:w-48 shrink-0 flex flex-col justify-center items-center md:items-start md:border-r md:border-slate-100 pr-0 md:pr-6">
                                            <div className="text-3xl font-bold text-slate-900 flex items-center gap-2 mb-1">
                                                {((review.rating_academic + review.rating_social + review.rating_facility) / 3).toFixed(1)}
                                                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs text-slate-500 w-full">
                                                <div className="flex justify-between w-full">
                                                    <span>วิชาการ</span>
                                                    <span className="font-medium text-slate-700">{review.rating_academic}</span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span>สังคม</span>
                                                    <span className="font-medium text-slate-700">{review.rating_social}</span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span>สถานที่</span>
                                                    <span className="font-medium text-slate-700">{review.rating_facility}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Context Info */}
                                            <div className="mb-3">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                                                    <span className="px-2 py-0.5 bg-blue-50 rounded-md">
                                                        {review.programs?.departments?.faculties?.universities?.name_th || 'ไม่ระบุ'}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{review.programs?.name_th || 'ไม่ระบุหลักสูตร'}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(review.created_at).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>

                                            {/* Comment Body */}
                                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                                "{review.comment || 'ไม่มีความคิดเห็น'}"
                                            </p>

                                            {/* Actions */}
                                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-50">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleDelete(review.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    ลบรีวิว
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
