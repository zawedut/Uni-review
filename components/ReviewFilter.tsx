'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Sparkles, Award, Trophy, BookOpen, GraduationCap, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFilterProps {
    selectedRound: string
    selectedYear: string
    selectedType?: string
    onRoundChange: (value: string) => void
    onYearChange: (value: string) => void
    onTypeChange?: (value: string) => void
    onClear: () => void
    totalCount: number
    filteredCount: number
}

const ADMISSION_ROUNDS = [
    { value: 'all', label: 'ทุกรอบ', icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-100' },
    { value: '1', label: 'Portfolio', fullLabel: 'รอบ 1 - Portfolio', icon: Award, color: 'text-violet-600', bg: 'bg-violet-100', gradient: 'from-violet-500 to-purple-600' },
    { value: '2', label: 'Quota', fullLabel: 'รอบ 2 - Quota', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-500 to-orange-600' },
    { value: '3', label: 'Admission', fullLabel: 'รอบ 3 - Admission', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100', gradient: 'from-emerald-500 to-green-600' },
    { value: '4', label: 'Direct', fullLabel: 'รอบ 4 - Direct', icon: GraduationCap, color: 'text-sky-600', bg: 'bg-sky-100', gradient: 'from-sky-500 to-blue-600' },
]

// Generate years from พ.ศ. 2553 (2010) to current year + 2
const currentBuddhistYear = new Date().getFullYear() + 543
const startYear = 2553
const ADMISSION_YEARS = [
    { value: 'all', label: 'ทุกปี' },
    ...Array.from({ length: currentBuddhistYear + 2 - startYear + 1 }, (_, i) => {
        const year = currentBuddhistYear + 2 - i
        return { value: String(year), label: `พ.ศ. ${year}` }
    })
]

export default function ReviewFilter({
    selectedRound,
    selectedYear,
    selectedType = 'all',
    onRoundChange,
    onYearChange,
    onTypeChange,
    onClear,
    totalCount,
    filteredCount,
}: ReviewFilterProps) {
    const hasFilters = selectedRound !== 'all' || selectedYear !== 'all' || selectedType !== 'all'
    const selectedRoundData = ADMISSION_ROUNDS.find(r => r.value === selectedRound)

    return (
        <div className="relative sm:sticky sm:top-20 z-20 mb-8">
            {/* Main Filter Card */}
            <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl">
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="relative p-5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                                <Filter className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">กรองรีวิว</h3>
                                <p className="text-xs text-slate-500">เลือกดูรีวิวตามรอบและปีที่สนใจ</p>
                            </div>
                        </div>

                        {/* Results Badge */}
                        <div className="hidden sm:flex items-center gap-2">
                            {hasFilters ? (
                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
                                    แสดง {filteredCount} จาก {totalCount}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-slate-200">
                                    ทั้งหมด {totalCount} รีวิว
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Review Type Tabs */}
                    <div className="mb-5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                            ประเภทรีวิว
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'all', label: 'ทั้งหมด', emoji: '✨' },
                                { value: 'admission', label: 'สอบเข้า', emoji: '📝' },
                                { value: 'study', label: 'การเรียน', emoji: '📚' },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => onTypeChange?.(type.value)}
                                    className={cn(
                                        "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                        selectedType === type.value
                                            ? type.value === 'study'
                                                ? 'bg-purple-500 text-white shadow-md'
                                                : type.value === 'admission'
                                                    ? 'bg-blue-500 text-white shadow-md'
                                                    : 'bg-slate-800 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    )}
                                >
                                    <span>{type.emoji}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Round Quick Select - Visual Cards */}
                    <div className="mb-5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                            เลือกรอบ TCAS
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {ADMISSION_ROUNDS.map((round) => {
                                const Icon = round.icon
                                const isSelected = selectedRound === round.value

                                return (
                                    <button
                                        key={round.value}
                                        onClick={() => onRoundChange(round.value)}
                                        className={cn(
                                            "relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300",
                                            "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                                            isSelected
                                                ? "border-transparent shadow-xl"
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                        )}
                                    >
                                        {/* Selected state gradient background */}
                                        {isSelected && round.gradient && (
                                            <div className={cn(
                                                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10",
                                                round.gradient
                                            )} />
                                        )}
                                        {isSelected && round.value === 'all' && (
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 opacity-50" />
                                        )}

                                        <div className={cn(
                                            "relative p-2 rounded-xl transition-all",
                                            isSelected ? round.bg : "bg-slate-50",
                                            isSelected && "shadow-md"
                                        )}>
                                            <Icon className={cn("w-5 h-5", round.color)} />
                                        </div>

                                        <div className="relative text-center">
                                            {round.value !== 'all' && (
                                                <span className={cn(
                                                    "text-[10px] font-bold",
                                                    isSelected ? round.color : "text-slate-400"
                                                )}>
                                                    รอบ {round.value}
                                                </span>
                                            )}
                                            <p className={cn(
                                                "text-xs font-semibold",
                                                isSelected ? "text-slate-800" : "text-slate-500"
                                            )}>
                                                {round.label}
                                            </p>
                                        </div>

                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className={cn(
                                                "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg bg-gradient-to-br",
                                                round.gradient || "from-slate-400 to-slate-500"
                                            )}>
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Year Selector Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-xl bg-slate-100">
                                <Calendar className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    ปีการศึกษา
                                </label>
                                <Select value={selectedYear} onValueChange={onYearChange}>
                                    <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200 hover:border-purple-300 focus:border-purple-400 transition-colors rounded-xl h-11">
                                        <SelectValue placeholder="เลือกปี" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {ADMISSION_YEARS.map((year) => (
                                            <SelectItem key={year.value} value={year.value} className="rounded-lg">
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Clear & Mobile Results */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Mobile Results */}
                            <div className="sm:hidden flex-1">
                                {hasFilters ? (
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1.5 text-xs font-bold">
                                        {filteredCount}/{totalCount}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-slate-500">{totalCount} รีวิว</span>
                                )}
                            </div>

                            {/* Clear Button */}
                            {hasFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClear}
                                    className="gap-2 text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 rounded-xl px-4"
                                >
                                    <X className="w-4 h-4" />
                                    ล้างตัวกรอง
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                            <span className="text-xs text-slate-500">ตัวกรองที่ใช้:</span>
                            {selectedRound !== 'all' && selectedRoundData && (
                                <Badge className={cn(
                                    "gap-1.5 px-3 py-1 border font-medium",
                                    selectedRoundData.bg,
                                    selectedRoundData.color,
                                    "border-current/20"
                                )}>
                                    {(() => {
                                        const Icon = selectedRoundData.icon
                                        return <Icon className="w-3.5 h-3.5" />
                                    })()}
                                    {selectedRoundData.fullLabel || selectedRoundData.label}
                                </Badge>
                            )}
                            {selectedYear !== 'all' && (
                                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    พ.ศ. {selectedYear}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
