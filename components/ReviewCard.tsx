'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Star,
    ChevronRight,
    Calendar,
    Award,
    Trophy,
    BookOpen,
    GraduationCap,
    ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
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
    portfolio_url?: string
    gpax?: number
    scores?: Record<string, number>
    achievements?: string
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
}

interface ReviewCardProps {
    review: Review
    onClick: () => void
}

const roundConfig: Record<number, { label: string; color: string; gradient: string; icon: React.ReactNode; bgLight: string }> = {
    1: {
        label: 'Portfolio',
        color: 'bg-violet-100 text-violet-700 border-violet-200',
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50',
        icon: <Award className="w-3.5 h-3.5" />
    },
    2: {
        label: 'Quota',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        icon: <Trophy className="w-3.5 h-3.5" />
    },
    3: {
        label: 'Admission',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        gradient: 'from-emerald-500 to-green-600',
        bgLight: 'bg-emerald-50',
        icon: <BookOpen className="w-3.5 h-3.5" />
    },
    4: {
        label: 'Direct',
        color: 'bg-sky-100 text-sky-700 border-sky-200',
        gradient: 'from-sky-500 to-blue-600',
        bgLight: 'bg-sky-50',
        icon: <GraduationCap className="w-3.5 h-3.5" />
    },
}

export default function ReviewCard({ review, onClick }: ReviewCardProps) {
    const avgRating = (review.review_type === 'study' && review.rating_overall) ? review.rating_overall.toFixed(1) : ((review.rating_academic + review.rating_social + review.rating_facility) / 3).toFixed(1)
    const round = review.admission_round ? roundConfig[review.admission_round] : null
    const isStudyReview = review.review_type === 'study'
    // Round 1, 2, 4 are portfolio/project based
    const isPortfolioRound = review.admission_round === 1 || review.admission_round === 2 || review.admission_round === 4

    // Get top 3 scores for preview
    const previewScores = review.scores
        ? Object.entries(review.scores).slice(0, 3)
        : []

    return (
        <Card
            onClick={onClick}
            className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            <CardContent className="p-0">
                {/* Color Strip on top based on type/round */}
                {isStudyReview ? (
                    <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 w-full" />
                ) : round ? (
                    <div className={cn("h-1.5 bg-gradient-to-r w-full", round.gradient)} />
                ) : null}

                <div className="p-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg shrink-0", isStudyReview ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-blue-500 to-purple-600")}>
                                {(review.profiles?.full_name || review.profiles?.email || 'U').charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                    {review.profiles?.full_name || review.profiles?.email || 'ผู้ใช้งานทั่วไป'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {new Date(review.created_at).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shrink-0">
                            <Star className="w-4 h-4 fill-white" />
                            <span className="font-bold">{avgRating}</span>
                        </div>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {isStudyReview ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border gap-1 text-xs px-2.5 py-0.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                รีวิวการเรียน
                            </Badge>
                        ) : round ? (
                            <Badge className={cn(round.color, "border gap-1 text-xs px-2.5 py-0.5")}>
                                {round.icon}
                                รอบ {review.admission_round}
                            </Badge>
                        ) : null}
                        {review.admission_year && (
                            <Badge variant="outline" className="gap-1 text-xs px-2.5 py-0.5 border-slate-200">
                                <Calendar className="w-3 h-3" />
                                {review.admission_year}
                            </Badge>
                        )}
                        {isStudyReview && review.study_year && (
                            <Badge variant="outline" className="gap-1 text-xs px-2.5 py-0.5 border-purple-200 text-purple-600">
                                ชั้นปี {review.study_year === 'grad' ? 'จบแล้ว' : review.study_year}
                            </Badge>
                        )}
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-3">
                        {/* Study Review Preview */}
                        {isStudyReview && (
                            <div className="p-3 rounded-lg bg-purple-50">
                                <div className="flex items-center gap-4">
                                    {review.workload_rating && (
                                        <div>
                                            <span className="text-xs text-purple-600 block mb-0.5">ภาระงาน</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className={cn("w-4 h-4 rounded-sm", i <= review.workload_rating! ? 'bg-purple-500' : 'bg-purple-200')} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {review.favorite_subjects && (
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-purple-600 block mb-0.5">วิชาที่ชอบ</span>
                                            <p className="text-sm text-purple-800 font-medium truncate">{review.favorite_subjects}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Portfolio/Project Round Preview (Round 1, 2, 4) */}
                        {!isStudyReview && isPortfolioRound && review.project_name && (
                            <div className={cn("p-3 rounded-lg", round?.bgLight || "bg-slate-50")}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <span className="text-xs text-slate-500 block mb-0.5">
                                            {review.admission_round === 4 ? 'โครงการรับตรง' : 'โครงการ'}
                                        </span>
                                        <p className="font-medium text-slate-800 truncate">{review.project_name}</p>
                                    </div>
                                    {review.portfolio_url && (
                                        <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Admission Round Preview */}
                        {review.admission_round === 3 && (
                            <div className="p-3 rounded-lg bg-emerald-50">
                                <div className="flex items-center gap-4">
                                    {review.gpax && (
                                        <div>
                                            <span className="text-xs text-emerald-600 block mb-0.5">GPAX</span>
                                            <span className="text-xl font-black text-emerald-700">{review.gpax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {previewScores.length > 0 && (
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-emerald-600 block mb-1">คะแนนสอบ</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {previewScores.map(([key, value]) => (
                                                    <span key={key} className="text-xs px-2 py-0.5 bg-white rounded-md text-emerald-700 font-medium">
                                                        {key}: {typeof value === 'number' ? value.toFixed(0) : value}
                                                    </span>
                                                ))}
                                                {Object.keys(review.scores || {}).length > 3 && (
                                                    <span className="text-xs text-emerald-500">+{Object.keys(review.scores || {}).length - 3} อื่นๆ</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mini Rating Breakdown */}
                        {isStudyReview ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-600 font-medium">👫 {review.rating_social_friends || review.rating_social}</span>
                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-600 font-medium">💰 {review.rating_cost || '-'}</span>
                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-600 font-medium">🍜 {review.rating_food || '-'}</span>
                                <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-600 font-medium">🌿 {review.rating_environment || review.rating_facility}</span>
                                <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 font-medium">⭐ {review.rating_overall || review.rating_academic}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-medium">
                                    📚 {review.rating_academic}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-pink-50 text-pink-600 font-medium">
                                    👥 {review.rating_social}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-600 font-medium">
                                    🏛️ {review.rating_facility}
                                </span>
                            </div>
                        )}

                        {/* Comment Preview */}
                        {review.comment && (
                            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                                &quot;{review.comment}&quot;
                            </p>
                        )}
                    </div>

                    {/* Footer - CTA */}
                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            ดูรายละเอียด
                            <ChevronRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
