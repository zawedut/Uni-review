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
    Award,
    Trophy,
    ArrowUpDown,
    Filter,
    Loader2,
    Link as LinkIcon,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Types
interface ReviewWithContext {
    id: string
    user_id: string
    program_id: string
    
    // Ratings
    rating_academic: number
    rating_social: number
    rating_facility: number
    rating_total: number | null 
    
    // Study Review Specific Details
    rating_social_friends?: number
    rating_cost?: number
    rating_food?: number
    rating_environment?: number
    rating_overall?: number

    // Content
    comment: string
    created_at: string
    review_type: 'admission' | 'study'

    // Admission Specific
    admission_round?: number
    admission_year?: number
    project_name?: string
    portfolio_url?: string
    gpax?: number
    scores?: Record<string, number | string> | null
    achievements?: string

    // Study Specific
    study_year?: string
    favorite_subjects?: string
    workload_rating?: number
    study_tips?: string

    // Relations
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
    const [fetchError, setFetchError] = useState<string | null>(null)

    // Filters
    const [sortBy, setSortBy] = useState<'latest' | 'rating'>('latest')
    const [filterUni, setFilterUni] = useState('all')
    const [filterType, setFilterType] = useState('all')

    const supabase = createClient()
    const PAGE_SIZE = 20

    useEffect(() => {
        const fetchUniversities = async () => {
            const { data } = await supabase
                .from('universities')
                .select('id, name_th')
                .order('name_th')
            if (data) setUniversities(data)
        }
        fetchUniversities()
    }, [supabase])

    const fetchReviews = useCallback(async (offset = 0, append = false) => {
        if (offset === 0) setLoading(true)
        else setLoadingMore(true)

        let query = supabase
            .from('reviews')
            .select(`
                id, user_id, program_id,
                rating_academic, rating_social, rating_facility, rating_total,
                comment, created_at, review_type,
                admission_round, admission_year, project_name, 
                portfolio_url, gpax, scores, achievements,
                study_year, favorite_subjects, workload_rating, study_tips, 
                rating_social_friends, rating_cost, rating_food, rating_environment, rating_overall,
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

        if (sortBy === 'latest') {
            query = query.order('created_at', { ascending: false })
        } else {
            query = query.order('rating_total', { ascending: false })
        }

        query = query.range(offset, offset + PAGE_SIZE - 1)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching reviews:', error)
            setFetchError(error.message)
            setLoading(false)
            return
        }

        if (data) {
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

    const getDisplayRating = (r: ReviewWithContext) => {
        if (r.rating_total !== null && r.rating_total !== undefined) {
            return Number(r.rating_total).toFixed(1)
        }
        return ((r.rating_academic + r.rating_social + r.rating_facility) / 3).toFixed(1)
    }

    const getUniName = (r: ReviewWithContext) =>
        r.programs?.departments?.faculties?.universities?.name_th || ''

    const getFacultyName = (r: ReviewWithContext) =>
        r.programs?.departments?.faculties?.name_th || ''

    const getProgramName = (r: ReviewWithContext) =>
        r.programs?.name_th || 'ไม่ระบุสาขา'

    const isStudyReview = (r: ReviewWithContext) => r.review_type === 'study'

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="container mx-auto px-4 py-8 max-w-3xl">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900">เสียงจากรุ่นพี่</h1>
                    <p className="text-slate-500">รวมรีวิวสอบเข้าและการเรียน (Count: {reviews.length})</p>
                </div>

                {fetchError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                        Error: {fetchError}
                    </div>
                )}

                {/* --- Filters Area --- */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 sticky top-20 z-10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* 1. Sort Filter */}
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="w-full">
                                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                                <span className="truncate text-left flex-1">
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">ล่าสุด</SelectItem>
                                <SelectItem value="rating">คะแนนสูงสุด</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* 2. University Filter (Fixed Overflow) */}
                        <Select value={filterUni} onValueChange={setFilterUni}>
                            <SelectTrigger className="w-full">
                                <Building2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                                <span className="truncate text-left flex-1">
                                    <SelectValue placeholder="ทุกมหาวิทยาลัย" />
                                </span>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="all">ทุกมหาวิทยาลัย</SelectItem>
                                {universities.map(uni => (
                                    <SelectItem key={uni.id} value={uni.id} className="cursor-pointer">
                                        <span className="line-clamp-2 text-left leading-tight">
                                            {uni.name_th}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* 3. Type Filter */}
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full">
                                <BookOpen className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                                <span className="truncate text-left flex-1">
                                    <SelectValue />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกประเภท</SelectItem>
                                <SelectItem value="admission">📝 รีวิวสอบเข้า</SelectItem>
                                <SelectItem value="study">📚 รีวิวการเรียน</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => {
                            const round = review.admission_round ? roundConfig[review.admission_round] : null
                            const study = isStudyReview(review)

                            return (
                                <Card key={review.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                                    <div className={cn(
                                        "h-1.5 w-full",
                                        study ? "bg-purple-500" : "bg-blue-500"
                                    )} />
                                    
                                    <CardContent className="p-5">
                                        {/* --- Header: Uni & Program (Fixed Overflow) --- */}
                                        <div className="flex justify-between items-start mb-3 gap-3">
                                            {/* Left side: Text info */}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="text-xs text-slate-500 font-medium mb-1 truncate w-full flex items-center gap-1">
                                                    <span className="truncate">{getUniName(review)}</span>
                                                    <ChevronRight className="w-3 h-3 shrink-0 opacity-30" />
                                                    <span className="truncate">{getFacultyName(review)}</span>
                                                </div>
                                                <Link 
                                                    href={`/program/${review.program_id}`} 
                                                    className="text-base font-bold text-slate-800 hover:text-blue-600 hover:underline truncate block w-full"
                                                >
                                                    {getProgramName(review)}
                                                </Link>
                                            </div>

                                            {/* Right side: Rating Score (Fixed width) */}
                                            <div className="shrink-0 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="font-bold text-amber-700">{getDisplayRating(review)}</span>
                                            </div>
                                        </div>

                                        {/* Tags Row */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {study ? (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 whitespace-nowrap">รีวิวการเรียน</Badge>
                                            ) : round && (
                                                <Badge className={cn("border-0 whitespace-nowrap", round.color)}>รอบ {review.admission_round} {round.label}</Badge>
                                            )}

                                            {review.admission_year && (
                                                <Badge variant="outline" className="text-slate-500 border-slate-200 whitespace-nowrap">
                                                    DEK{review.admission_year.toString().slice(-2)}
                                                </Badge>
                                            )}

                                            {!study && review.gpax && (
                                                <Badge variant="outline" className="text-slate-600 bg-slate-50 whitespace-nowrap">
                                                    GPAX {Number(review.gpax).toFixed(2)}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Admission Scores Grid */}
                                        {!study && review.scores && Object.keys(review.scores).length > 0 && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">คะแนนที่ใช้ยื่น</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(review.scores).map(([subject, score]) => (
                                                        <div key={subject} className="px-2 py-1 bg-white rounded border border-slate-200 text-xs shadow-sm whitespace-nowrap">
                                                            <span className="font-bold text-slate-600 mr-1">{subject}:</span>
                                                            <span className="text-blue-600 font-medium">{score}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comment */}
                                        {review.comment && (
                                            <div className="mb-4 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm break-words">
                                                {review.comment}
                                            </div>
                                        )}

                                        {/* Portfolio Link */}
                                        {!study && review.portfolio_url && (
                                            <a href={review.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4 p-2 bg-blue-50 rounded-md w-fit max-w-full">
                                                <LinkIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate">ดูพอร์ตฟอลิโอ</span>
                                            </a>
                                        )}

                                        {/* Footer */}
                                        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-y-2 justify-between items-center text-xs text-slate-400">
                                            <div className="flex gap-3 flex-wrap">
                                                <span className="flex items-center gap-1 whitespace-nowrap"><GraduationCap className="w-3 h-3"/> วิชาการ {review.rating_academic}</span>
                                                <span className="flex items-center gap-1 whitespace-nowrap"><Building2 className="w-3 h-3"/> สถานที่ {review.rating_facility}</span>
                                                <span className="flex items-center gap-1 whitespace-nowrap"><Users className="w-3 h-3"/> สังคม {review.rating_social}</span>
                                            </div>
                                            <span className="whitespace-nowrap">{new Date(review.created_at).toLocaleDateString('th-TH')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                        
                        {hasMore && (
                            <Button variant="outline" className="w-full mt-4" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}