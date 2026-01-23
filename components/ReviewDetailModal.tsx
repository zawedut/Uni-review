'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ScoreTable from '@/components/ScoreTable'
import {
    Star,
    GraduationCap,
    Users,
    Building2,
    ExternalLink,
    Calendar,
    Award,
    BookOpen,
    ThumbsUp,
    ThumbsDown,
    Trophy,
    Trash2
} from 'lucide-react'
import { useState } from 'react'

interface Review {
    id: string
    user_id: string
    program_id: string
    rating_academic: number
    rating_social: number
    rating_facility: number
    comment: string
    created_at: string
    admission_round?: number
    admission_year?: number
    project_name?: string
    portfolio_url?: string
    gpax?: number
    scores?: Record<string, number>
    achievements?: string
    likes?: number
    dislikes?: number
    profiles?: {
        full_name?: string
        email?: string
    }
}

interface ReviewDetailModalProps {
    review: Review | null
    isOpen: boolean
    onClose: () => void
    currentUserId?: string
    onDelete?: (reviewId: string) => Promise<void>
}

const roundConfig: Record<number, { label: string; color: string; gradient: string; icon: React.ReactNode }> = {
    1: {
        label: 'Portfolio',
        color: 'bg-violet-100 text-violet-700 border-violet-200',
        gradient: 'from-violet-500 to-purple-600',
        icon: <Award className="w-4 h-4" />
    },
    2: {
        label: 'Quota',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        gradient: 'from-amber-500 to-orange-600',
        icon: <Trophy className="w-4 h-4" />
    },
    3: {
        label: 'Admission',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        gradient: 'from-emerald-500 to-green-600',
        icon: <BookOpen className="w-4 h-4" />
    },
    4: {
        label: 'Direct',
        color: 'bg-sky-100 text-sky-700 border-sky-200',
        gradient: 'from-sky-500 to-blue-600',
        icon: <GraduationCap className="w-4 h-4" />
    },
}

export default function ReviewDetailModal({ review, isOpen, onClose, currentUserId, onDelete }: ReviewDetailModalProps) {
    const [likes, setLikes] = useState(review?.likes || 0)
    const [dislikes, setDislikes] = useState(review?.dislikes || 0)
    const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    if (!review) return null

    const avgRating = ((review.rating_academic + review.rating_social + review.rating_facility) / 3).toFixed(1)
    const round = review.admission_round ? roundConfig[review.admission_round] : null
    // Round 1, 2, 4 are portfolio/project based
    const isPortfolioRound = review.admission_round === 1 || review.admission_round === 2 || review.admission_round === 4
    const isOwnReview = currentUserId && review.user_id === currentUserId

    const handleVote = (type: 'like' | 'dislike') => {
        if (userVote === type) {
            setUserVote(null)
            if (type === 'like') setLikes(prev => prev - 1)
            else setDislikes(prev => prev - 1)
        } else {
            if (userVote === 'like') setLikes(prev => prev - 1)
            if (userVote === 'dislike') setDislikes(prev => prev - 1)
            setUserVote(type)
            if (type === 'like') setLikes(prev => prev + 1)
            else setDislikes(prev => prev + 1)
        }
    }

    const handleDelete = async () => {
        if (!onDelete || !confirm('คุณต้องการลบรีวิวนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) return

        setIsDeleting(true)
        try {
            await onDelete(review.id)
            onClose()
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการลบรีวิว')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {(review.profiles?.full_name || review.profiles?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">
                                {review.profiles?.full_name || review.profiles?.email || 'ผู้ใช้งานทั่วไป'}
                            </p>
                            <p className="text-xs text-slate-400 font-normal">
                                {new Date(review.created_at).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2">
                        {round && (
                            <Badge className={`${round.color} border gap-1.5 px-3 py-1`}>
                                {round.icon}
                                รอบ {review.admission_round} - {round.label}
                            </Badge>
                        )}
                        {review.admission_year && (
                            <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                <Calendar className="w-3.5 h-3.5" />
                                ปี {review.admission_year}
                            </Badge>
                        )}
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 gap-1 px-3 py-1">
                            <Star className="w-3.5 h-3.5 fill-white" />
                            {avgRating}
                        </Badge>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <GraduationCap className="w-6 h-6 text-blue-600 mb-2" />
                            <span className="text-2xl font-black text-blue-600">{review.rating_academic}</span>
                            <span className="text-xs text-blue-600/70 font-medium">วิชาการ</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-pink-50 border border-pink-100">
                            <Users className="w-6 h-6 text-pink-600 mb-2" />
                            <span className="text-2xl font-black text-pink-600">{review.rating_social}</span>
                            <span className="text-xs text-pink-600/70 font-medium">สังคม</span>
                        </div>
                        <div className="flex flex-col items-center p-4 rounded-xl bg-green-50 border border-green-100">
                            <Building2 className="w-6 h-6 text-green-600 mb-2" />
                            <span className="text-2xl font-black text-green-600">{review.rating_facility}</span>
                            <span className="text-xs text-green-600/70 font-medium">สถานที่</span>
                        </div>
                    </div>

                    {/* Portfolio/Project Section (Round 1, 2, 4) */}
                    {isPortfolioRound && (
                        <div className={`space-y-4 p-4 rounded-xl bg-gradient-to-br border ${review.admission_round === 4
                            ? 'from-sky-50 to-blue-50 border-sky-100'
                            : 'from-violet-50 to-purple-50 border-violet-100'
                            }`}>
                            <h4 className={`font-bold flex items-center gap-2 ${review.admission_round === 4 ? 'text-sky-800' : 'text-violet-800'
                                }`}>
                                <Award className="w-5 h-5" />
                                {review.admission_round === 4 ? 'ข้อมูลการรับตรง' : 'ข้อมูลการยื่น Portfolio'}
                            </h4>

                            {review.project_name && (
                                <div>
                                    <span className={`text-xs font-medium ${review.admission_round === 4 ? 'text-sky-600' : 'text-violet-600'
                                        }`}>ชื่อโครงการ</span>
                                    <p className="text-slate-800 font-semibold">{review.project_name}</p>
                                </div>
                            )}

                            {review.achievements && (
                                <div>
                                    <span className={`text-xs font-medium ${review.admission_round === 4 ? 'text-sky-600' : 'text-violet-600'
                                        }`}>รายละเอียดผลงาน</span>
                                    <p className="text-slate-700 whitespace-pre-wrap">{review.achievements}</p>
                                </div>
                            )}

                            {review.portfolio_url && (
                                <Button
                                    variant="outline"
                                    className={`gap-2 ${review.admission_round === 4
                                        ? 'border-sky-300 text-sky-700 hover:bg-sky-100'
                                        : 'border-violet-300 text-violet-700 hover:bg-violet-100'
                                        }`}
                                    onClick={() => window.open(review.portfolio_url, '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    ดู Portfolio
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Admission Section (Round 3) */}
                    {review.admission_round === 3 && (
                        <div className="space-y-4">
                            {review.gpax && (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-emerald-700 font-medium">GPAX</span>
                                        <span className="text-3xl font-black text-emerald-600">{review.gpax.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {review.scores && Object.keys(review.scores).length > 0 && (
                                <ScoreTable scores={review.scores} />
                            )}
                        </div>
                    )}

                    {/* Comment Section */}
                    {review.comment && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                💬 ประสบการณ์และความเห็น
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    &quot;{review.comment}&quot;
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Like/Dislike Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">รีวิวนี้มีประโยชน์ไหม?</span>
                            <div className="flex items-center gap-2">
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
                            </div>
                        </div>

                        {/* Delete Button for own reviews */}
                        {isOwnReview && onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'กำลังลบ...' : 'ลบรีวิว'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
