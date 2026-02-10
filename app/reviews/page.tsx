'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Star,
    GraduationCap,
    Building2,
    Users,
    BookOpen,
    Calendar,
    Award,
    Trophy,
    ArrowUpDown,
    Filter,
    MessageSquareText,
    ChevronRight,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Types
interface ReviewWithContext {
    id: string
    user_id: string
    program_id: string
    rating_academic: number
    rating_social: number
    rating_facility: number
    comment: string
    created_at: string
    review_type?: string
    admission_round?: number
    admission_year?: number
    project_name?: string
    study_year?: string
    favorite_subjects?: string
    workload_rating?: number
    study_tips?: string
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
    programs?: {
        id: string
        name_th: string
        departments?: {
            name_th: string
            faculties?: {
                name_th: string
                universities?: {
                    id: string
                    name_th: string
                    logo_url?: string
                }
            }
        }
    }
}

interface University {
    id: string
    name_th: string
}

const roundConfig: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
    1: { label: 'Portfolio', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Award className="w-3 h-3" /> },
    2: { label: 'Quota', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Trophy className="w-3 h-3" /> },
    3: { label: 'Admission', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <BookOpen className="w-3 h-3" /> },
    4: { label: 'Direct', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: <GraduationCap className="w-3 h-3" /> },
}

export default function ReviewsFeedPage() {
    const [reviews, setReviews] = useState<ReviewWithContext[]>([])
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    // Filters
    const [sortBy, setSortBy] = useState<'latest' | 'rating'>('latest')
    const [filterUni, setFilterUni] = useState('all')
    const [filterType, setFilterType] = useState('all')

    const supabase = createClient()
    const PAGE_SIZE = 20

    // Fetch universities for filter dropdown
    useEffect(() => {
        const fetchUniversities = async () => {
            const { data } = await supabase
                .from('universities')
                .select('id, name_th')
                .order('name_th')
            if (data) setUniversities(data)
        }
        fetchUniversities()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch reviews
    const fetchReviews = useCallback(async (offset = 0, append = false) => {
        if (offset === 0) setLoading(true)
        else setLoadingMore(true)

        let query = supabase
            .from('reviews')
            .select(`
                id, user_id, program_id,
                rating_academic, rating_social, rating_facility,
                comment, created_at, review_type,
                admission_round, admission_year,
                project_name, study_year, favorite_subjects,
                workload_rating, study_tips, likes, dislikes,
                rating_social_friends, rating_cost, rating_food,
                rating_environment, rating_overall,
                programs (
                    id, name_th,
                    departments (
                        name_th,
                        faculties (
                            name_th,
                            universities ( id, name_th, logo_url )
                        )
                    )
                )
            `)

        // Sort
        if (sortBy === 'latest') {
            query = query.order('created_at', { ascending: false })
        } else {
            query = query.order('rating_academic', { ascending: false })
        }

        // Pagination
        query = query.range(offset, offset + PAGE_SIZE - 1)

        const { data, error } = await query

        if (!error && data) {
            // Client-side filter for university (since it's nested)
            let filtered = data as unknown as ReviewWithContext[]

            if (filterUni !== 'all') {
                filtered = filtered.filter(r => {
                    const uniId = r.programs?.departments?.faculties?.universities?.id
                    return uniId === filterUni
                })
            }

            if (filterType !== 'all') {
                filtered = filtered.filter(r => (r.review_type || 'admission') === filterType)
            }

            if (append) {
                setReviews(prev => [...prev, ...filtered])
            } else {
                setReviews(filtered)
            }
            setHasMore(data.length === PAGE_SIZE)
        }

        setLoading(false)
        setLoadingMore(false)
    }, [supabase, sortBy, filterUni, filterType])

    useEffect(() => {
        fetchReviews(0, false)
    }, [fetchReviews])

    const loadMore = () => {
        fetchReviews(reviews.length, true)
    }

    const avgRating = (r: ReviewWithContext) =>
        r.review_type === 'study' && r.rating_overall
            ? r.rating_overall.toFixed(1)
            : ((r.rating_academic + r.rating_social + r.rating_facility) / 3).toFixed(1)

    const getUniName = (r: ReviewWithContext) =>
        r.programs?.departments?.faculties?.universities?.name_th || ''

    const getFacultyName = (r: ReviewWithContext) =>
        r.programs?.departments?.faculties?.name_th || ''

    const getProgramName = (r: ReviewWithContext) =>
        r.programs?.name_th || ''

    const isStudyReview = (r: ReviewWithContext) => r.review_type === 'study'

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20">
            <div className="container mx-auto px-4 py-8 max-w-3xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                        <MessageSquareText className="w-4 h-4" />
                        รีวิวทั้งหมด
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                        เสียงจากรุ่นพี่
                    </h1>
                    <p className="text-slate-500">รีวิวล่าสุดจากนักศึกษาจริงทุกมหาวิทยาลัย</p>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-4 mb-8 sm:sticky sm:top-20 z-20">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-600">กรอง</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Sort */}
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'latest' | 'rating')}>
                            <SelectTrigger className="h-11">
                                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">ล่าสุด</SelectItem>
                                <SelectItem value="rating">คะแนนสูงสุด</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* University Filter */}
                        <Select value={filterUni} onValueChange={setFilterUni}>
                            <SelectTrigger className="h-11">
                                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="มหาวิทยาลัย" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกมหาวิทยาลัย</SelectItem>
                                {universities.map(uni => (
                                    <SelectItem key={uni.id} value={uni.id}>{uni.name_th}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Type Filter */}
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-11">
                                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกประเภท</SelectItem>
                                <SelectItem value="admission">📝 สอบเข้า</SelectItem>
                                <SelectItem value="study">📚 การเรียน</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                        <p className="text-slate-400">กำลังโหลดรีวิว...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <MessageSquareText className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600 mb-1">ยังไม่มีรีวิว</h3>
                        <p className="text-slate-400">ลองเปลี่ยนตัวกรองดูนะ</p>
                    </div>
                ) : (
                    /* Reviews Feed */
                    <div className="space-y-5">
                        {reviews.map((review, i) => {
                            const round = review.admission_round ? roundConfig[review.admission_round] : null
                            const study = isStudyReview(review)

                            return (
                                <Card
                                    key={review.id}
                                    className="overflow-hidden border-slate-200/60 bg-white hover:shadow-xl transition-all duration-300 animate-slide-up"
                                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                                >
                                    <CardContent className="p-0">
                                        {/* Color strip */}
                                        <div className={cn(
                                            "h-1 w-full",
                                            study
                                                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                                : round
                                                    ? `bg-gradient-to-r ${round === roundConfig[1] ? 'from-violet-500 to-purple-600' : round === roundConfig[2] ? 'from-amber-500 to-orange-600' : round === roundConfig[3] ? 'from-emerald-500 to-green-600' : 'from-sky-500 to-blue-600'}`
                                                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                                        )} />

                                        <div className="p-5 sm:p-6">
                                            {/* Context: Uni > Faculty > Program */}
                                            <Link
                                                href={`/program/${review.program_id}`}
                                                className="group flex items-center gap-2 text-xs text-slate-400 mb-3 hover:text-blue-500 transition-colors"
                                            >
                                                <span className="font-medium truncate">{getUniName(review)}</span>
                                                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                                                <span className="truncate">{getFacultyName(review)}</span>
                                                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                                                <span className="font-semibold text-slate-500 group-hover:text-blue-600 truncate">{getProgramName(review)}</span>
                                            </Link>

                                            {/* Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                {study ? (
                                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 border gap-1 text-xs">
                                                        <BookOpen className="w-3 h-3" />
                                                        📚 รีวิวการเรียน
                                                    </Badge>
                                                ) : round ? (
                                                    <Badge className={cn(round.color, "border gap-1 text-xs")}>
                                                        {round.icon}
                                                        รอบ {review.admission_round}
                                                    </Badge>
                                                ) : null}
                                                {review.admission_year && (
                                                    <Badge variant="outline" className="text-xs border-slate-200 gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {review.admission_year}
                                                    </Badge>
                                                )}
                                                {study && review.study_year && (
                                                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-600 gap-1">
                                                        ชั้นปี {review.study_year === 'grad' ? 'จบแล้ว' : review.study_year}
                                                    </Badge>
                                                )}
                                                <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span className="text-sm font-bold">{avgRating(review)}</span>
                                                </div>
                                            </div>

                                            {/* ★ THE REVIEW COMMENT — emphasized */}
                                            {review.comment && (
                                                <div className="relative mb-4">
                                                    <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-blue-400 to-purple-400" />
                                                    <blockquote className="pl-5 text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                                                        &ldquo;{review.comment}&rdquo;
                                                    </blockquote>
                                                </div>
                                            )}

                                            {/* Study review extras */}
                                            {study && (review.favorite_subjects || review.workload_rating || review.study_tips) && (
                                                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 mb-4 space-y-2">
                                                    {review.favorite_subjects && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-purple-500 font-semibold shrink-0">วิชาเด่น:</span>
                                                            <span className="text-sm text-purple-800">{review.favorite_subjects}</span>
                                                        </div>
                                                    )}
                                                    {review.workload_rating && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-purple-500 font-semibold shrink-0">ภาระงาน:</span>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map(i => (
                                                                    <div key={i} className={cn("w-5 h-2.5 rounded-sm", i <= review.workload_rating! ? 'bg-purple-500' : 'bg-purple-200')} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {review.study_tips && (
                                                        <div>
                                                            <span className="text-xs text-purple-500 font-semibold">Tips:</span>
                                                            <p className="text-sm text-purple-800 mt-0.5">{review.study_tips}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Rating Breakdown + User info */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                {study ? (
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                                        <span className="flex items-center gap-1">👫 {review.rating_social_friends || review.rating_social}</span>
                                                        <span className="flex items-center gap-1">💰 {review.rating_cost || '-'}</span>
                                                        <span className="flex items-center gap-1">🍜 {review.rating_food || '-'}</span>
                                                        <span className="flex items-center gap-1">🌿 {review.rating_environment || review.rating_facility}</span>
                                                        <span className="flex items-center gap-1 text-amber-500 font-semibold">⭐ {review.rating_overall || review.rating_academic}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                                                            {review.rating_academic}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5 text-pink-400" />
                                                            {review.rating_social}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="w-3.5 h-3.5 text-green-400" />
                                                            {review.rating_facility}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold", study ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-blue-500 to-purple-600")}>
                                                        {(review.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="hidden sm:inline">{review.profiles?.full_name || 'ผู้ใช้งาน'}</span>
                                                    <span>·</span>
                                                    <span>{new Date(review.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}

                        {/* Load More */}
                        {hasMore && (
                            <div className="text-center pt-4 pb-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="rounded-full px-8 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            กำลังโหลด...
                                        </>
                                    ) : (
                                        'โหลดเพิ่มเติม'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
