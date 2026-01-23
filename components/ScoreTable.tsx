'use client'

import { cn } from '@/lib/utils'

interface ScoreTableProps {
    scores: Record<string, number>
    className?: string
}

// Complete TCAS Score Categories with Thai names
export const SCORE_CATEGORIES = {
    TGAT: {
        name: 'TGAT ความถนัดทั่วไป',
        color: 'violet',
        scores: [
            { key: 'TGAT1', label: 'TGAT1 การสื่อสารภาษาอังกฤษ' },
            { key: 'TGAT2', label: 'TGAT2 การคิดวิเคราะห์' },
            { key: 'TGAT3', label: 'TGAT3 สมรรถนะการทำงาน' },
        ]
    },
    TPAT: {
        name: 'TPAT ความถนัดวิชาชีพ',
        color: 'amber',
        scores: [
            { key: 'TPAT1', label: 'TPAT1 ความถนัดแพทย์ (กสพท.)' },
            { key: 'TPAT2', label: 'TPAT2 ความถนัดศิลปกรรมศาสตร์' },
            { key: 'TPAT3', label: 'TPAT3 วิทย์-เทคโนโลยี-วิศวะ' },
            { key: 'TPAT4', label: 'TPAT4 ความถนัดสถาปัตยกรรม' },
            { key: 'TPAT5', label: 'TPAT5 ครุศาสตร์-ศึกษาศาสตร์' },
        ]
    },
    ALEVEL: {
        name: 'A-Level ความรู้เชิงวิชาการ',
        color: 'emerald',
        scores: [
            { key: 'A_Math1', label: 'คณิตศาสตร์ประยุกต์ 1' },
            { key: 'A_Math2', label: 'คณิตศาสตร์ประยุกต์ 2' },
            { key: 'A_Sci', label: 'วิทยาศาสตร์ประยุกต์' },
            { key: 'A_Phy', label: 'ฟิสิกส์' },
            { key: 'A_Chem', label: 'เคมี' },
            { key: 'A_Bio', label: 'ชีววิทยา' },
            { key: 'A_Thai', label: 'ภาษาไทย' },
            { key: 'A_Eng', label: 'ภาษาอังกฤษ' },
            { key: 'A_Soc', label: 'สังคมศึกษา' },
            { key: 'A_FR', label: 'ภาษาฝรั่งเศส' },
            { key: 'A_DE', label: 'ภาษาเยอรมัน' },
            { key: 'A_ZH', label: 'ภาษาจีน' },
            { key: 'A_JA', label: 'ภาษาญี่ปุ่น' },
            { key: 'A_KO', label: 'ภาษาเกาหลี' },
            { key: 'A_PA', label: 'ภาษาบาลี' },
        ]
    }
}

// Flat list of all scores for form selection
export const ALL_SCORE_TYPES = [
    ...SCORE_CATEGORIES.TGAT.scores,
    ...SCORE_CATEGORIES.TPAT.scores,
    ...SCORE_CATEGORIES.ALEVEL.scores,
]

// Map English keys to Thai names
const scoreNameMap: Record<string, string> = {}
ALL_SCORE_TYPES.forEach(s => {
    scoreNameMap[s.key] = s.label
})

// Get color class based on score
const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-700'
    return 'bg-rose-50 border-rose-200 text-rose-700'
}

const getScoreBgGradient = (score: number): string => {
    if (score >= 80) return 'from-emerald-500 to-green-600'
    if (score >= 60) return 'from-amber-500 to-orange-600'
    return 'from-rose-500 to-red-600'
}

const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'TGAT': return 'from-violet-500 to-purple-600'
        case 'TPAT': return 'from-amber-500 to-orange-600'
        case 'ALEVEL': return 'from-emerald-500 to-green-600'
        default: return 'from-slate-500 to-slate-600'
    }
}

const getCategoryBorder = (category: string): string => {
    switch (category) {
        case 'TGAT': return 'border-violet-200'
        case 'TPAT': return 'border-amber-200'
        case 'ALEVEL': return 'border-emerald-200'
        default: return 'border-slate-200'
    }
}

export default function ScoreTable({ scores, className }: ScoreTableProps) {
    if (!scores || Object.keys(scores).length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p>ไม่มีข้อมูลคะแนนสอบ</p>
            </div>
        )
    }

    // Group scores by category
    const groupedScores: Record<string, Array<{ key: string; value: number; label: string }>> = {
        TGAT: [],
        TPAT: [],
        ALEVEL: [],
        OTHER: []
    }

    Object.entries(scores).forEach(([key, value]) => {
        const score = typeof value === 'number' ? value : parseFloat(String(value)) || 0
        const label = scoreNameMap[key] || key.replace(/_/g, ' ')

        if (key.startsWith('TGAT')) {
            groupedScores.TGAT.push({ key, value: score, label })
        } else if (key.startsWith('TPAT')) {
            groupedScores.TPAT.push({ key, value: score, label })
        } else if (key.startsWith('A_')) {
            groupedScores.ALEVEL.push({ key, value: score, label })
        } else {
            groupedScores.OTHER.push({ key, value: score, label })
        }
    })

    const categories = [
        { id: 'TGAT', name: 'TGAT ความถนัดทั่วไป', icon: '🧠' },
        { id: 'TPAT', name: 'TPAT ความถนัดวิชาชีพ', icon: '🎯' },
        { id: 'ALEVEL', name: 'A-Level วิชาการ', icon: '📚' },
    ]

    return (
        <div className={cn('space-y-6', className)}>
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                📊 คะแนนสอบ TCAS
            </h4>

            {categories.map(category => {
                const categoryScores = groupedScores[category.id]
                if (categoryScores.length === 0) return null

                return (
                    <div key={category.id} className="space-y-3">
                        {/* Category Header */}
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm bg-gradient-to-r",
                            getCategoryColor(category.id)
                        )}>
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                {categoryScores.length} วิชา
                            </span>
                        </div>

                        {/* Score Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categoryScores.map(({ key, value, label }) => (
                                <div
                                    key={key}
                                    className={cn(
                                        'relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:scale-[1.02]',
                                        getScoreColor(value),
                                        getCategoryBorder(category.id)
                                    )}
                                >
                                    {/* Background progress bar */}
                                    <div
                                        className={cn(
                                            'absolute inset-y-0 left-0 opacity-20 bg-gradient-to-r',
                                            getScoreBgGradient(value)
                                        )}
                                        style={{ width: `${Math.min(value, 100)}%` }}
                                    />

                                    <div className="relative flex items-center justify-between">
                                        <span className="text-sm font-semibold truncate pr-2">
                                            {label}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-2xl font-black tabular-nums">
                                                {value.toFixed(1)}
                                            </span>
                                            <span className="text-xs opacity-70">/100</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}

            {/* Other scores */}
            {groupedScores.OTHER.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-slate-500 to-slate-600">
                        <span>📋</span>
                        <span>อื่นๆ</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupedScores.OTHER.map(({ key, value, label }) => (
                            <div
                                key={key}
                                className={cn(
                                    'relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md',
                                    getScoreColor(value)
                                )}
                            >
                                <div className="relative flex items-center justify-between">
                                    <span className="text-sm font-medium truncate pr-2">{label}</span>
                                    <span className="text-xl font-black tabular-nums">{value.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600" />
                    <span>≥80 ดีมาก</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
                    <span>60-79 ดี</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-500 to-red-600" />
                    <span>&lt;60 ปานกลาง</span>
                </div>
            </div>
        </div>
    )
}
