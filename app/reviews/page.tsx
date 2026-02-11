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
    Link as LinkIcon,
    FileText,
    Utensils,
    Wallet,
    Trees
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Types: ตรงกับ DB 100%
interface ReviewWithContext {
    id: string
    user_id: string
    program_id: string
    
    // Ratings
    rating_academic: number
    rating_social: number
    rating_facility: number
    rating_total: number | null // Generated Column
    
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
    scores?: Record<string, number | string> | null // JSONB
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
    }, [supabase])

    // Fetch reviews
    const fetchReviews = useCallback(async (offset = 0, append = false) => {
        if (offset === 0) setLoading(true)
        else setLoadingMore(true)

        // Query: ตัด profiles ออกเพราะติด permission auth.users
        // และดึง field ใหม่ๆ ทั้งหมด
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

        // Sort
        if (sortBy === 'latest') {
            query = query.order('created_at', { ascending: false })
        } else {
            // ใช้ rating_total ที่ DB คำนวณให้แล้ว
            query = query.order('rating_total', { ascending: false })
        }

        // Pagination
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

            // Filter University (Client-side)
            if (filterUni !== 'all') {
                filtered = filtered.filter(r => {
                    const uniId = r.programs?.departments?.faculties?.universities?.id
                    return uniId === filterUni
                })
            }

            // Filter Type
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

    // Helpers
    const getDisplayRating = (r: ReviewWithContext) => {
        // ถ้ามี rating_total จาก DB ให้ใช้เลย
        if (r.rating_total !== null && r.rating_total !== undefined) {
            return Number(r.rating_total).toFixed(1)
        }
        // Fallback คำนวณเอง
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

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900">เสียงจากรุ่นพี่</h1>
                    <p className="text-slate-500">รวมรีวิวสอบเข้าและการเรียน (Count: {reviews.length})</p>
                </div>

                {/* Error Debug */}
                {fetchError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                        Error: {fetchError}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 sticky top-20 z-10 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger>
                                <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">ล่าสุด</SelectItem>
                                <SelectItem value="rating">คะแนนสูงสุด</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterUni} onValueChange={setFilterUni}>
                            <SelectTrigger>
                                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="ทุกมหาวิทยาลัย" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกมหาวิทยาลัย</SelectItem>
                                {universities.map(uni => (
                                    <SelectItem key={uni.id} value={uni.id}>{uni.name_th}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue />
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
                                        {/* Header: Uni & Program */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-500 font-medium mb-0.5">
                                                    {getUniName(review)} • {getFacultyName(review)}
                                                </span>
                                                <Link href={`/program/${review.program_id}`} className="text-base font-bold text-slate-800 hover:text-blue-600 hover:underline line-clamp-1">
                                                    {getProgramName(review)}
                                                </Link>
                                            </div>
                                            {/* Rating Score */}
                                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="font-bold text-amber-700">{getDisplayRating(review)}</span>
                                            </div>
                                        </div>

                                        {/* Tags Row */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {/* Review Type Badge */}
                                            {study ? (
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">รีวิวการเรียน</Badge>
                                            ) : round && (
                                                <Badge className={cn("border-0", round.color)}>รอบ {review.admission_round} {round.label}</Badge>
                                            )}

                                            {/* Year */}
                                            {review.admission_year && (
                                                <Badge variant="outline" className="text-slate-500 border-slate-200">
                                                    DEK{review.admission_year.toString().slice(-2)}
                                                </Badge>
                                            )}

                                            {/* GPAX */}
                                            {!study && review.gpax && (
                                                <Badge variant="outline" className="text-slate-600 bg-slate-50">
                                                    GPAX {Number(review.gpax).toFixed(2)}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Admission Scores Grid (Only if exists) */}
                                        {!study && review.scores && Object.keys(review.scores).length > 0 && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">คะแนนที่ใช้ยื่น</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(review.scores).map(([subject, score]) => (
                                                        <div key={subject} className="px-2 py-1 bg-white rounded border border-slate-200 text-xs shadow-sm">
                                                            <span className="font-bold text-slate-600 mr-1">{subject}:</span>
                                                            <span className="text-blue-600 font-medium">{score}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comment */}
                                        {review.comment && (
                                            <div className="mb-4 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                                {review.comment}
                                            </div>
                                        )}

                                        {/* Portfolio Link */}
                                        {!study && review.portfolio_url && (
                                            <a href={review.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4 p-2 bg-blue-50 rounded-md w-fit">
                                                <LinkIcon className="w-3 h-3" />
                                                ดูพอร์ตฟอลิโอ
                                            </a>
                                        )}

                                        {/* Footer */}
                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                            <div className="flex gap-3">
                                                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3"/> วิชาการ {review.rating_academic}</span>
                                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/> สถานที่ {review.rating_facility}</span>
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3"/> สังคม {review.rating_social}</span>
                                            </div>
                                            <span>{new Date(review.created_at).toLocaleDateString('th-TH')}</span>
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