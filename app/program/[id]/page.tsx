'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Star, GraduationCap, Building2, Users, ChevronRight, PenLine, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Star Rating Input - Adjusted size to prevent overlap
const StarInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
        <label className="text-sm font-bold text-slate-700 mb-2 truncate w-full text-center">{label}</label>
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="focus:outline-none transition-transform active:scale-95 p-0.5"
                >
                    <Star
                        className={`w-6 h-6 transition-colors duration-150 ${star <= value
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 hover:text-amber-200'
                            }`}
                    />
                </button>
            ))}
        </div>
        <div className="h-5 mt-2">
            {value > 0 ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    {value} คะแนน
                </span>
            ) : (
                <span className="text-[10px] text-slate-400">เลือกคะแนน</span>
            )}
        </div>
    </div>
)

// Review Card Component with Like/Dislike
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReviewCard = ({ review }: { review: any }) => {
    const [likes, setLikes] = useState<number>(review.likes || 0)
    const [dislikes, setDislikes] = useState<number>(review.dislikes || 0)
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)

    const handleVote = (type: 'like' | 'dislike') => {
        if (userVote === type) {
            // Remove vote
            setUserVote(null)
            if (type === 'like') setLikes(prev => prev - 1)
            else setDislikes(prev => prev - 1)
        } else {
            // Change vote
            if (userVote === 'like') setLikes(prev => prev - 1)
            if (userVote === 'dislike') setDislikes(prev => prev - 1)
            setUserVote(type)
            if (type === 'like') setLikes(prev => prev + 1)
            else setDislikes(prev => prev + 1)
        }
    }

    const avgRating = ((review.rating_academic + review.rating_social + review.rating_facility) / 3).toFixed(1)

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(review.profiles?.full_name || review.profiles?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{review.profiles?.full_name || review.profiles?.email || 'ผู้ใช้งานทั่วไป'}</p>
                            <p className="text-xs text-slate-400">
                                {new Date(review.created_at).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
                        <Star className="w-4 h-4 fill-white" />
                        <span className="font-bold">{avgRating}</span>
                    </div>
                </div>

                {/* Comment */}
                {review.comment && (
                    <p className="text-slate-700 mb-4 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        &quot;{review.comment}&quot;
                    </p>
                )}

                {/* Scores */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-medium border border-blue-200/50">
                        📚 วิชาการ {review.rating_academic}/5
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 text-sm font-medium border border-pink-200/50">
                        👥 สังคม {review.rating_social}/5
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-sm font-medium border border-green-200/50">
                        🏛️ สถานที่ {review.rating_facility}/5
                    </span>
                </div>

                {/* Like/Dislike */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => handleVote('like')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${userVote === 'like'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600'
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-medium">{likes}</span>
                    </button>
                    <button
                        onClick={() => handleVote('dislike')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${userVote === 'dislike'
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600'
                            }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="font-medium">{dislikes}</span>
                    </button>
                    <span className="text-xs text-slate-400 ml-auto">
                        คนอื่นเห็นว่ารีวิวนี้มีประโยชน์ไหม?
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProgramReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [program, setProgram] = useState<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reviews, setReviews] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [form, setForm] = useState({ academic: 0, social: 0, facility: 0, comment: '' })
    const [submitting, setSubmitting] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    const fetchReviews = useCallback(async () => {
        // 1. Fetch reviews
        const { data: reviewsData, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('program_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching reviews:', error)
            setLoading(false)
            return
        }

        if (reviewsData && reviewsData.length > 0) {
            // 2. Fetch profiles related to these reviews manually
            const userIds = [...new Set(reviewsData.map(r => r.user_id))]
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            // 3. Map profiles to reviews
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profilesMap: Record<string, any> = {}
            profilesData?.forEach(p => {
                profilesMap[p.id] = p
            })

            const reviewsWithProfiles = reviewsData.map(review => ({
                ...review,
                profiles: profilesMap[review.user_id] || { full_name: 'ผู้ใช้งาน', email: '' }
            }))

            setReviews(reviewsWithProfiles)
        } else {
            setReviews([])
        }
        setLoading(false)
    }, [id, supabase])

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            const { data: prog } = await supabase
                .from('programs')
                .select('*, departments(name_th, faculties(name_th, universities(name_th, id)))')
                .eq('id', id)
                .single()
            setProgram(prog)

            fetchReviews()
        }
        init()
    }, [id, supabase, fetchReviews])



    const stats = reviews.reduce((acc, r) => ({
        academic: acc.academic + r.rating_academic,
        social: acc.social + r.rating_social,
        facility: acc.facility + r.rating_facility,
        count: acc.count + 1
    }), { academic: 0, social: 0, facility: 0, count: 0 })

    const avg = (val: number) => stats.count === 0 ? '--' : (val / stats.count).toFixed(1)
    const totalAvg = stats.count === 0 ? '--' : ((stats.academic + stats.social + stats.facility) / (stats.count * 3)).toFixed(1)

    const handleSubmit = async () => {
        if (!user) return router.push('/login')
        if (form.academic === 0 || form.social === 0 || form.facility === 0) {
            alert('กรุณาให้คะแนนครบทุกช่อง')
            return
        }

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
            setIsOpen(false)
            setForm({ academic: 0, social: 0, facility: 0, comment: '' })
            fetchReviews()
        } else {
            alert(error.message)
        }
        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-48 bg-slate-200 rounded" />
                        <div className="h-8 w-64 bg-slate-200 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-20">
            {/* Header */}
            <section className="pt-20 pb-8 md:pt-24 md:pb-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-1 text-sm text-slate-500 mb-4">
                        <Link href="/" className="hover:text-blue-600 transition-colors">หน้าหลัก</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/university/${program?.departments?.faculties?.universities?.id}`} className="hover:text-blue-600 transition-colors truncate">
                            {program?.departments?.faculties?.universities?.name_th}
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-sm">
                            {program?.degree_type}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {program?.campus}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{program?.name_th}</h1>
                    <p className="text-slate-500">
                        {program?.departments?.faculties?.name_th} • {program?.departments?.name_th}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-8 md:py-10">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar - Stats */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24 border-slate-200/50 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                                <CardContent className="p-6 relative">
                                    {/* Overall Score */}
                                    <div className="text-center pb-5 border-b border-slate-100 mb-5">
                                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
                                            <span className="text-4xl font-black">{totalAvg}</span>
                                            {totalAvg !== '--' && <Star className="w-8 h-8 fill-white" />}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-3 font-medium">
                                            {reviews.length > 0 ? (
                                                <>
                                                    <span className="text-blue-600 font-bold">{reviews.length}</span> รีวิว
                                                </>
                                            ) : 'ยังไม่มีรีวิว'}
                                        </p>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                                            <span className="text-slate-700 flex items-center gap-2 font-medium">
                                                <GraduationCap className="w-5 h-5 text-blue-600" /> วิชาการ
                                            </span>
                                            <span className="font-bold text-blue-600 text-lg">{avg(stats.academic)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-pink-50 border border-pink-100">
                                            <span className="text-slate-700 flex items-center gap-2 font-medium">
                                                <Users className="w-5 h-5 text-pink-600" /> สังคม
                                            </span>
                                            <span className="font-bold text-pink-600 text-lg">{avg(stats.social)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-xl bg-green-50 border border-green-100">
                                            <span className="text-slate-700 flex items-center gap-2 font-medium">
                                                <Building2 className="w-5 h-5 text-green-600" /> สถานที่
                                            </span>
                                            <span className="font-bold text-green-600 text-lg">{avg(stats.facility)}</span>
                                        </div>
                                    </div>

                                    {/* Write Review Button */}
                                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                                                <PenLine className="w-5 h-5 mr-2" />
                                                เขียนรีวิว
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-xl">
                                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                                    เขียนรีวิว
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-5 py-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <StarInput label="📚 วิชาการ" value={form.academic} onChange={(v) => setForm({ ...form, academic: v })} />
                                                    <StarInput label="👥 สังคม" value={form.social} onChange={(v) => setForm({ ...form, social: v })} />
                                                    <StarInput label="🏛️ สถานที่" value={form.facility} onChange={(v) => setForm({ ...form, facility: v })} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-semibold text-slate-700 block mb-2">💬 ความคิดเห็น</label>
                                                    <Textarea
                                                        placeholder="แชร์ประสบการณ์ของคุณ... อะไรดี อะไรควรปรับปรุง?"
                                                        rows={4}
                                                        value={form.comment}
                                                        onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                                        className="resize-none"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={submitting}
                                                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <span className="animate-spin mr-2">⏳</span>
                                                            กำลังส่ง...
                                                        </>
                                                    ) : (
                                                        '🚀 ส่งรีวิว'
                                                    )}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Reviews */}
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                💬 รีวิวทั้งหมด
                                {reviews.length > 0 && (
                                    <span className="text-sm font-normal text-slate-500">({reviews.length})</span>
                                )}
                            </h2>

                            {reviews.length === 0 ? (
                                <Card className="border-dashed border-2 border-slate-200 bg-white/50">
                                    <CardContent className="py-16 text-center">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                            <PenLine className="w-10 h-10 text-blue-400" />
                                        </div>
                                        <p className="text-slate-500 mb-6 text-lg">ยังไม่มีรีวิว เป็นคนแรกที่แชร์ประสบการณ์!</p>
                                        <Button
                                            onClick={() => setIsOpen(true)}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            ✍️ เขียนรีวิวแรก
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-5">
                                    {reviews.map((review) => (
                                        <ReviewCard key={review.id} review={review} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}