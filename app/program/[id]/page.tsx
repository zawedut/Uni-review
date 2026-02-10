'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, GraduationCap, Building2, Users, ChevronRight, PenLine, Sparkles, Plus, Minus, BookOpen, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import ReviewFilter from '@/components/ReviewFilter'
import ReviewCard from '@/components/ReviewCard'
import ReviewDetailModal from '@/components/ReviewDetailModal'
import { SCORE_CATEGORIES, ALL_SCORE_TYPES } from '@/components/ScoreTable'

// Types
interface Review {
    id: string
    user_id: string
    program_id: string
    rating_academic: number
    rating_social: number
    rating_facility: number
    comment: string
    created_at: string
    review_type?: string // 'admission' | 'study'
    admission_round?: number
    admission_year?: number
    project_name?: string
    portfolio_url?: string
    gpax?: number
    scores?: Record<string, number>
    achievements?: string
    study_year?: string
    favorite_subjects?: string
    workload_rating?: number
    study_tips?: string
    // Study-specific ratings
    rating_social_friends?: number
    rating_cost?: number
    rating_food?: number
    rating_environment?: number
    rating_overall?: number
    likes?: number
    dislikes?: number
    profiles?: {
        full_name?: string
        email?: string
    }
}

// Star Rating Input Component
const StarInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors w-full">
        <label className="text-sm font-bold text-slate-700 mb-1 truncate w-full text-center">{label}</label>
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="focus:outline-none transition-transform active:scale-95 p-1"
                >
                    <Star
                        className={`w-5 h-5 transition-colors duration-150 ${star <= value
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 hover:text-amber-200'
                            }`}
                    />
                </button>
            ))}
        </div>
        <div className="h-5 mt-1">
            {value > 0 ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    {value} คะแนน
                </span>
            ) : (
                <span className="text-[10px] text-slate-400">เลือกคะแนน</span>
            )}
        </div>
    </div>
)

// Score Input Component for TCAS scores
const ScoreInput = ({
    label,
    value,
    onChange
}: {
    label: string
    value: number | undefined
    onChange: (v: number | undefined) => void
}) => (
    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
        <span className="text-sm text-slate-600 truncate">{label}</span>
        <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            className="w-20 h-8 text-sm text-center"
            placeholder="-"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
        />
    </div>
)

// Generate years for dropdown (พ.ศ. 2553 to current+2, descending)
const currentBuddhistYear = new Date().getFullYear() + 543
const startYear = 2553
const ADMISSION_YEARS = Array.from({ length: currentBuddhistYear + 2 - startYear + 1 }, (_, i) => currentBuddhistYear + 2 - i)

// Use score types from ScoreTable component
const SCORE_TYPES = ALL_SCORE_TYPES

export default function ProgramReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [program, setProgram] = useState<any>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Filter states
    const [filterRound, setFilterRound] = useState('all')
    const [filterYear, setFilterYear] = useState('all')
    const [filterType, setFilterType] = useState('all') // 'all' | 'admission' | 'study'

    // Modal states
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Form states
    const [formStep, setFormStep] = useState(1)
    const [form, setForm] = useState({
        review_type: '' as string, // 'admission' | 'study'
        academic: 0,
        social: 0,
        facility: 0,
        comment: '',
        admission_round: '',
        admission_year: '',
        project_name: '',
        portfolio_url: '',
        gpax: '',
        achievements: '',
        scores: {} as Record<string, number>,
        // Study review fields
        study_year: '',
        favorite_subjects: '',
        workload_rating: 0,
        study_tips: '',
        // Study-specific ratings
        social_friends: 0,
        cost_of_living: 0,
        food: 0,
        environment: 0,
        overall: 0,
    })
    const [selectedScoreTypes, setSelectedScoreTypes] = useState<string[]>(['TGAT', 'A_Math1', 'A_Eng'])

    const supabase = createClient()
    const router = useRouter()

    const fetchReviews = useCallback(async () => {
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
            const userIds = [...new Set(reviewsData.map(r => r.user_id))]
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

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

    // Filter reviews
    const filteredReviews = reviews.filter(review => {
        const matchRound = filterRound === 'all' || review.admission_round === parseInt(filterRound)
        const matchYear = filterYear === 'all' || review.admission_year === parseInt(filterYear)
        const matchType = filterType === 'all' || (review.review_type || 'admission') === filterType
        return matchRound && matchYear && matchType
    })

    const clearFilters = () => {
        setFilterRound('all')
        setFilterYear('all')
        setFilterType('all')
    }

    // Stats calculation
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
        if (!form.review_type) {
            alert('กรุณาเลือกประเภทรีวิว')
            return
        }
        if (form.review_type === 'admission' && (form.academic === 0 || form.social === 0 || form.facility === 0)) {
            alert('กรุณาให้คะแนนครบทุกช่อง')
            return
        }
        if (form.review_type === 'study' && (form.social_friends === 0 || form.cost_of_living === 0 || form.food === 0 || form.environment === 0 || form.overall === 0)) {
            alert('กรุณาให้คะแนนครบทุกช่อง')
            return
        }
        if (form.review_type === 'admission' && (!form.admission_round || !form.admission_year)) {
            alert('กรุณาเลือกรอบและปีที่ติด')
            return
        }

        setSubmitting(true)

        const reviewData: Record<string, unknown> = {
            program_id: id,
            user_id: user.id,
            comment: form.comment,
            review_type: form.review_type,
        }

        if (form.review_type === 'admission') {
            reviewData.rating_academic = form.academic
            reviewData.rating_social = form.social
            reviewData.rating_facility = form.facility
        } else {
            // For study reviews, map the new ratings to the existing columns + new columns
            reviewData.rating_academic = form.overall
            reviewData.rating_social = form.social_friends
            reviewData.rating_facility = form.environment
            reviewData.rating_social_friends = form.social_friends
            reviewData.rating_cost = form.cost_of_living
            reviewData.rating_food = form.food
            reviewData.rating_environment = form.environment
            reviewData.rating_overall = form.overall
        }

        if (form.review_type === 'admission') {
            reviewData.admission_round = parseInt(form.admission_round)
            reviewData.admission_year = parseInt(form.admission_year)

            // Add round-specific fields
            const round = parseInt(form.admission_round)
            if (round === 1 || round === 2 || round === 4) {
                reviewData.project_name = form.project_name
                reviewData.portfolio_url = form.portfolio_url
                reviewData.achievements = form.achievements
            } else if (round === 3) {
                reviewData.gpax = form.gpax ? parseFloat(form.gpax) : null
                reviewData.scores = Object.keys(form.scores).length > 0 ? form.scores : null
            }
        } else if (form.review_type === 'study') {
            reviewData.study_year = form.study_year || null
            reviewData.favorite_subjects = form.favorite_subjects || null
            reviewData.workload_rating = form.workload_rating || null
            reviewData.study_tips = form.study_tips || null
            reviewData.admission_year = form.admission_year ? parseInt(form.admission_year) : null
        }

        const { error } = await supabase.from('reviews').insert([reviewData])

        if (!error) {
            setIsOpen(false)
            setFormStep(1)
            setForm({
                review_type: '', academic: 0, social: 0, facility: 0, comment: '',
                admission_round: '', admission_year: '', project_name: '',
                portfolio_url: '', gpax: '', achievements: '', scores: {},
                study_year: '', favorite_subjects: '', workload_rating: 0, study_tips: '',
                social_friends: 0, cost_of_living: 0, food: 0, environment: 0, overall: 0,
            })
            fetchReviews()
        } else {
            alert(error.message)
        }
        setSubmitting(false)
    }

    const handleCardClick = (review: Review) => {
        setSelectedReview(review)
        setIsDetailOpen(true)
    }

    const addScoreType = (key: string) => {
        if (!selectedScoreTypes.includes(key)) {
            setSelectedScoreTypes([...selectedScoreTypes, key])
        }
    }

    const removeScoreType = (key: string) => {
        setSelectedScoreTypes(selectedScoreTypes.filter(k => k !== key))
        const newScores = { ...form.scores }
        delete newScores[key]
        setForm({ ...form, scores: newScores })
    }

    const updateScore = (key: string, value: number | undefined) => {
        if (value !== undefined) {
            setForm({ ...form, scores: { ...form.scores, [key]: value } })
        } else {
            const newScores = { ...form.scores }
            delete newScores[key]
            setForm({ ...form, scores: newScores })
        }
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
                                    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setFormStep(1) }}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                                                <PenLine className="w-5 h-5 mr-2" />
                                                เขียนรีวิว
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-xl">
                                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                                    เขียนรีวิว - ขั้นตอน {formStep}/4
                                                </DialogTitle>
                                            </DialogHeader>

                                            {/* Step 1: Choose Review Type */}
                                            {formStep === 1 && (
                                                <div className="space-y-5 py-4">
                                                    <p className="text-sm text-slate-500">เลือกประเภทรีวิวที่ต้องการเขียน</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setForm({ ...form, review_type: 'admission' }); setFormStep(2) }}
                                                            className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                                                                form.review_type === 'admission'
                                                                    ? 'border-blue-400 bg-blue-50 shadow-md'
                                                                    : 'border-slate-200 bg-white hover:border-blue-300'
                                                            }`}
                                                        >
                                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                                                                <ClipboardCheck className="w-7 h-7" />
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="font-bold text-slate-800 block">📝 รีวิวสอบเข้า</span>
                                                                <span className="text-xs text-slate-500 mt-1 block">TCAS, คะแนน, Portfolio</span>
                                                            </div>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setForm({ ...form, review_type: 'study' }); setFormStep(2) }}
                                                            className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                                                                form.review_type === 'study'
                                                                    ? 'border-purple-400 bg-purple-50 shadow-md'
                                                                    : 'border-slate-200 bg-white hover:border-purple-300'
                                                            }`}
                                                        >
                                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                                                                <BookOpen className="w-7 h-7" />
                                                            </div>
                                                            <div className="text-center">
                                                                <span className="font-bold text-slate-800 block">📚 รีวิวการเรียน</span>
                                                                <span className="text-xs text-slate-500 mt-1 block">วิชา, ภาระงาน, บรรยากาศ</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 2: Details based on type */}
                                            {formStep === 2 && form.review_type === 'admission' && (
                                                <div className="space-y-5 py-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-semibold">รอบที่ติด *</Label>
                                                        <Select value={form.admission_round} onValueChange={(v) => setForm({ ...form, admission_round: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="เลือกรอบ TCAS" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">รอบ 1 - Portfolio</SelectItem>
                                                                <SelectItem value="2">รอบ 2 - Quota</SelectItem>
                                                                <SelectItem value="3">รอบ 3 - Admission</SelectItem>
                                                                <SelectItem value="4">รอบ 4 - Direct Admission</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-semibold">ปีที่เข้าเรียน *</Label>
                                                        <Select value={form.admission_year} onValueChange={(v) => setForm({ ...form, admission_year: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="เลือกปี พ.ศ." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ADMISSION_YEARS.map(year => (
                                                                    <SelectItem key={year} value={String(year)}>พ.ศ. {year}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Round 1, 2, 4: Portfolio/Project fields */}
                                                    {(form.admission_round === '1' || form.admission_round === '2' || form.admission_round === '4') && (
                                                        <div className={`space-y-4 p-4 rounded-xl border ${form.admission_round === '4'
                                                            ? 'bg-sky-50 border-sky-100'
                                                            : 'bg-violet-50 border-violet-100'
                                                            }`}>
                                                            <h4 className={`font-bold ${form.admission_round === '4' ? 'text-sky-700' : 'text-violet-700'
                                                                }`}>
                                                                📁 {form.admission_round === '4' ? 'ข้อมูลการรับตรง' : 'ข้อมูล Portfolio'}
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <Label className="text-sm">ชื่อโครงการที่ยื่น</Label>
                                                                <Input
                                                                    placeholder={form.admission_round === '4'
                                                                        ? "เช่น รับตรงอิสระ, โครงการพิเศษ"
                                                                        : "เช่น โครงการ Gifted, โควต้าพื้นที่"
                                                                    }
                                                                    value={form.project_name}
                                                                    onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-sm">ลิงก์ Portfolio (ถ้ามี)</Label>
                                                                <Input
                                                                    placeholder="https://..."
                                                                    value={form.portfolio_url}
                                                                    onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-sm">รายละเอียดผลงาน/กิจกรรม</Label>
                                                                <Textarea
                                                                    placeholder="เล่าสั้นๆ ว่าคุณมีผลงานอะไรบ้าง..."
                                                                    rows={3}
                                                                    value={form.achievements}
                                                                    onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Round 3: Admission scores */}
                                                    {form.admission_round === '3' && (
                                                        <div className="space-y-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                                            <h4 className="font-bold text-emerald-700">📊 ข้อมูลคะแนนสอบ</h4>
                                                            <div className="space-y-3">
                                                                <Label className="text-sm">GPAX</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="4"
                                                                    placeholder="เช่น 3.85"
                                                                    value={form.gpax}
                                                                    onChange={(e) => setForm({ ...form, gpax: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm">คะแนนสอบ</Label>
                                                                    <Select onValueChange={addScoreType}>
                                                                        <SelectTrigger className="w-[180px] h-8 text-xs">
                                                                            <Plus className="w-3 h-3 mr-1" />
                                                                            <SelectValue placeholder="เพิ่มวิชา" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {SCORE_TYPES.filter(s => !selectedScoreTypes.includes(s.key)).map(score => (
                                                                                <SelectItem key={score.key} value={score.key}>{score.label}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {selectedScoreTypes.map(key => {
                                                                        const scoreType = SCORE_TYPES.find(s => s.key === key)
                                                                        return (
                                                                            <div key={key} className="flex items-center gap-2">
                                                                                <ScoreInput
                                                                                    label={scoreType?.label || key}
                                                                                    value={form.scores[key]}
                                                                                    onChange={(v) => updateScore(key, v)}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeScoreType(key)}
                                                                                    className="p-1 text-red-400 hover:text-red-600"
                                                                                >
                                                                                    <Minus className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3">
                                                        <Button variant="outline" onClick={() => setFormStep(1)} className="flex-1">
                                                            ย้อนกลับ
                                                        </Button>
                                                        <Button
                                                            onClick={() => setFormStep(3)}
                                                            disabled={!form.admission_round || !form.admission_year}
                                                            className="flex-1"
                                                        >
                                                            ถัดไป
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 2: Study Review Details */}
                                            {formStep === 2 && form.review_type === 'study' && (
                                                <div className="space-y-5 py-4">
                                                    <div className="space-y-4 p-4 rounded-xl bg-purple-50 border border-purple-100">
                                                        <h4 className="font-bold text-purple-700">📚 ข้อมูลการเรียน</h4>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm">ปีที่เข้าเรียน</Label>
                                                            <Select value={form.admission_year} onValueChange={(v) => setForm({ ...form, admission_year: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="เลือกปี พ.ศ." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ADMISSION_YEARS.map(year => (
                                                                        <SelectItem key={year} value={String(year)}>พ.ศ. {year}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm">ชั้นปีที่เรียน</Label>
                                                            <Select value={form.study_year} onValueChange={(v) => setForm({ ...form, study_year: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="เลือกชั้นปี" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="1">ปี 1</SelectItem>
                                                                    <SelectItem value="2">ปี 2</SelectItem>
                                                                    <SelectItem value="3">ปี 3</SelectItem>
                                                                    <SelectItem value="4">ปี 4</SelectItem>
                                                                    <SelectItem value="5">ปี 5</SelectItem>
                                                                    <SelectItem value="6">ปี 6</SelectItem>
                                                                    <SelectItem value="grad">จบแล้ว</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm">วิชาที่ชอบ / ที่เด่น</Label>
                                                            <Input
                                                                placeholder="เช่น แคลคูลัส, ฟิสิกส์, โปรแกรมมิ่ง"
                                                                value={form.favorite_subjects}
                                                                onChange={(e) => setForm({ ...form, favorite_subjects: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm">ภาระงาน (Workload) 1-5</Label>
                                                            <div className="flex items-center gap-1">
                                                                {[1, 2, 3, 4, 5].map((level) => (
                                                                    <button
                                                                        key={level}
                                                                        type="button"
                                                                        onClick={() => setForm({ ...form, workload_rating: level })}
                                                                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                                                            form.workload_rating >= level
                                                                                ? 'bg-purple-500 text-white shadow-md'
                                                                                : 'bg-white text-slate-400 border border-slate-200 hover:border-purple-300'
                                                                        }`}
                                                                    >
                                                                        {level}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-slate-400 px-1">
                                                                <span>น้อย</span>
                                                                <span>มาก</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm">Tips สำหรับน้อง</Label>
                                                            <Textarea
                                                                placeholder="อยากบอกอะไรน้องๆ ที่จะมาเรียน..."
                                                                rows={3}
                                                                value={form.study_tips}
                                                                onChange={(e) => setForm({ ...form, study_tips: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button variant="outline" onClick={() => setFormStep(1)} className="flex-1">
                                                            ย้อนกลับ
                                                        </Button>
                                                        <Button
                                                            onClick={() => setFormStep(3)}
                                                            className="flex-1"
                                                        >
                                                            ถัดไป
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 3: Ratings */}
                                            {formStep === 3 && (
                                                <div className="space-y-5 py-4">
                                                    {form.review_type === 'admission' ? (
                                                        /* Admission ratings */
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <StarInput label="📚 วิชาการ" value={form.academic} onChange={(v) => setForm({ ...form, academic: v })} />
                                                            <StarInput label="👥 สังคม" value={form.social} onChange={(v) => setForm({ ...form, social: v })} />
                                                            <StarInput label="🏛️ สถานที่" value={form.facility} onChange={(v) => setForm({ ...form, facility: v })} />
                                                        </div>
                                                    ) : (
                                                        /* Study ratings */
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-purple-600 font-semibold">📚 ให้คะแนนประสบการณ์การเรียน</p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <StarInput label="👫 สังคม / เพื่อน" value={form.social_friends} onChange={(v) => setForm({ ...form, social_friends: v })} />
                                                                <StarInput label="💰 ค่าครองชีพ" value={form.cost_of_living} onChange={(v) => setForm({ ...form, cost_of_living: v })} />
                                                                <StarInput label="🍜 อาหาร" value={form.food} onChange={(v) => setForm({ ...form, food: v })} />
                                                                <StarInput label="🌿 สภาพแวดล้อม" value={form.environment} onChange={(v) => setForm({ ...form, environment: v })} />
                                                            </div>
                                                            <div className="pt-2 border-t border-purple-100">
                                                                <StarInput label="⭐ ภาพรวม" value={form.overall} onChange={(v) => setForm({ ...form, overall: v })} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-3">
                                                        <Button variant="outline" onClick={() => setFormStep(2)} className="flex-1">
                                                            ย้อนกลับ
                                                        </Button>
                                                        <Button
                                                            onClick={() => setFormStep(4)}
                                                            disabled={
                                                                form.review_type === 'admission'
                                                                    ? (form.academic === 0 || form.social === 0 || form.facility === 0)
                                                                    : (form.social_friends === 0 || form.cost_of_living === 0 || form.food === 0 || form.environment === 0 || form.overall === 0)
                                                            }
                                                            className="flex-1"
                                                        >
                                                            ถัดไป
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 4: Comment */}
                                            {formStep === 4 && (
                                                <div className="space-y-5 py-4">
                                                    <div>
                                                        <Label className="text-sm font-semibold text-slate-700 block mb-2">💬 ความคิดเห็น</Label>
                                                        <Textarea
                                                            placeholder="แชร์ประสบการณ์ของคุณ... อะไรดี อะไรควรปรับปรุง? บรรยากาศในคณะเป็นยังไง?"
                                                            rows={5}
                                                            value={form.comment}
                                                            onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                                            className="resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <Button variant="outline" onClick={() => setFormStep(3)} className="flex-1">
                                                            ย้อนกลับ
                                                        </Button>
                                                        <Button
                                                            onClick={handleSubmit}
                                                            disabled={submitting}
                                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                                                </div>
                                            )}
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

                            {/* Filter Bar */}
                            {reviews.length > 0 && (
                                <ReviewFilter
                                    selectedRound={filterRound}
                                    selectedYear={filterYear}
                                    selectedType={filterType}
                                    onRoundChange={setFilterRound}
                                    onYearChange={setFilterYear}
                                    onTypeChange={setFilterType}
                                    onClear={clearFilters}
                                    totalCount={reviews.length}
                                    filteredCount={filteredReviews.length}
                                />
                            )}

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
                            ) : filteredReviews.length === 0 ? (
                                <Card className="border-dashed border-2 border-slate-200 bg-white/50">
                                    <CardContent className="py-12 text-center">
                                        <p className="text-slate-500">ไม่พบรีวิวที่ตรงกับตัวกรอง</p>
                                        <Button variant="link" onClick={clearFilters} className="mt-2">
                                            ล้างตัวกรอง
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-5">
                                    {filteredReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            onClick={() => handleCardClick(review)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Review Detail Modal */}
            <ReviewDetailModal
                review={selectedReview}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                currentUserId={user?.id}
                onDelete={async (reviewId) => {
                    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
                    if (error) throw error
                    fetchReviews()
                }}
            />
        </div>
    )
}