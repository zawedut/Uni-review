'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Search,
    X,
    Building2,
    BookOpen,
    GraduationCap,
    Loader2,
    TrendingUp,
    Clock,
    Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SearchResult {
    id: string
    type: 'university' | 'faculty' | 'program'
    name: string
    subtitle?: string
    path: string
    rating?: number
    reviewCount?: number
}

interface GlobalSearchProps {
    className?: string
    placeholder?: string
    autoFocus?: boolean
}

// Simple fuzzy match - checks if all characters of query appear in text in order
function fuzzyMatch(text: string, query: string): boolean {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    // Direct include check first
    if (textLower.includes(queryLower)) return true

    // Fuzzy character matching
    let queryIndex = 0
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            queryIndex++
        }
    }
    return queryIndex === queryLower.length
}

// Score results for ranking
function getMatchScore(text: string, query: string): number {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    // Exact match gets highest score
    if (textLower === queryLower) return 100
    // Starts with gets high score
    if (textLower.startsWith(queryLower)) return 90
    // Contains gets medium score
    if (textLower.includes(queryLower)) return 70
    // Fuzzy match gets lower score
    return 50
}

export default function GlobalSearch({ className, placeholder = "ค้นหามหาวิทยาลัย คณะ หรือหลักสูตร...", autoFocus = false }: GlobalSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [recentSearches, setRecentSearches] = useState<string[]>([])

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches')
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved).slice(0, 5))
            } catch {
                // Ignore parse errors
            }
        }
    }, [])

    // Save search to recent
    const saveRecentSearch = (search: string) => {
        const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    // Perform search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([])
            return
        }

        setIsLoading(true)

        try {
            // Fetch all data in parallel
            const [uniRes, facRes, progRes] = await Promise.all([
                supabase.from('universities').select('id, name_th, name_en'),
                supabase.from('faculties').select('id, name_th, name_en, university_id, universities(name_th)'),
                supabase.from('programs').select(`
          id, name_th, name_en, degree_type,
          departments(
            id, name_th,
            faculties(
              name_th,
              universities(name_th)
            )
          )
        `).limit(100)
            ])

            const searchResults: SearchResult[] = []

            // Search Universities
            uniRes.data?.forEach(uni => {
                if (fuzzyMatch(uni.name_th, searchQuery) || (uni.name_en && fuzzyMatch(uni.name_en, searchQuery))) {
                    searchResults.push({
                        id: uni.id,
                        type: 'university',
                        name: uni.name_th,
                        subtitle: uni.name_en,
                        path: `/university/${uni.id}`,
                    })
                }
            })

            // Search Faculties
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            facRes.data?.forEach((fac: any) => {
                if (fuzzyMatch(fac.name_th, searchQuery) || (fac.name_en && fuzzyMatch(fac.name_en, searchQuery))) {
                    searchResults.push({
                        id: fac.id,
                        type: 'faculty',
                        name: fac.name_th,
                        subtitle: fac.universities?.name_th,
                        path: `/university/${fac.university_id}`,
                    })
                }
            })

            // Search Programs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            progRes.data?.forEach((prog: any) => {
                if (fuzzyMatch(prog.name_th, searchQuery) || (prog.name_en && fuzzyMatch(prog.name_en, searchQuery))) {
                    const faculty = prog.departments?.faculties
                    const uni = faculty?.universities
                    searchResults.push({
                        id: prog.id,
                        type: 'program',
                        name: prog.name_th,
                        subtitle: `${faculty?.name_th || ''} • ${uni?.name_th || ''}`,
                        path: `/program/${prog.id}`,
                    })
                }
            })

            // Sort by match score
            searchResults.sort((a, b) => {
                const scoreA = getMatchScore(a.name, searchQuery)
                const scoreB = getMatchScore(b.name, searchQuery)
                if (scoreB !== scoreA) return scoreB - scoreA
                // Secondary sort by type priority
                const typePriority = { university: 3, faculty: 2, program: 1 }
                return typePriority[b.type] - typePriority[a.type]
            })

            setResults(searchResults.slice(0, 15))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query, performSearch])

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, -1))
        } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
            e.preventDefault()
            saveRecentSearch(query)
            window.location.href = results[selectedIndex].path
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            inputRef.current?.blur()
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'university': return <Building2 className="w-4 h-4" />
            case 'faculty': return <BookOpen className="w-4 h-4" />
            case 'program': return <GraduationCap className="w-4 h-4" />
            default: return null
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'university':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">มหาวิทยาลัย</Badge>
            case 'faculty':
                return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">คณะ</Badge>
            case 'program':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">หลักสูตร</Badge>
            default:
                return null
        }
    }

    const handleResultClick = (result: SearchResult) => {
        saveRecentSearch(query)
        setIsOpen(false)
    }

    const popularSearches = ['จุฬาลงกรณ์', 'มหิดล', 'วิศวกรรม', 'แพทย์', 'นิติศาสตร์', 'เศรษฐศาสตร์']

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20" />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center">
                        <Search className="w-6 h-6 text-slate-400 ml-5" />
                        <Input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setIsOpen(true)
                                setSelectedIndex(-1)
                            }}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            autoFocus={autoFocus}
                            className="flex-1 h-16 text-lg border-0 shadow-none focus-visible:ring-0 bg-transparent px-4"
                        />
                        {isLoading && (
                            <Loader2 className="w-5 h-5 text-slate-400 mr-3 animate-spin" />
                        )}
                        {query && !isLoading && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mr-2 text-slate-400 hover:text-slate-600"
                                onClick={() => {
                                    setQuery('')
                                    setResults([])
                                    inputRef.current?.focus()
                                }}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.length >= 2 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {/* Results */}
                    {query.length >= 2 && results.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                ผลการค้นหา ({results.length})
                            </div>
                            {results.map((result, index) => (
                                <Link
                                    key={`${result.type}-${result.id}`}
                                    href={result.path}
                                    onClick={() => handleResultClick(result)}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                            selectedIndex === index && "bg-blue-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            result.type === 'university' && "bg-blue-100 text-blue-600",
                                            result.type === 'faculty' && "bg-purple-100 text-purple-600",
                                            result.type === 'program' && "bg-emerald-100 text-emerald-600"
                                        )}>
                                            {getTypeIcon(result.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800 truncate">
                                                    {result.name}
                                                </span>
                                                {getTypeBadge(result.type)}
                                            </div>
                                            {result.subtitle && (
                                                <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {query.length >= 2 && results.length === 0 && !isLoading && (
                        <div className="py-12 text-center">
                            <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500">ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;</p>
                            <p className="text-sm text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น</p>
                        </div>
                    )}

                    {/* Recent & Popular Searches (when no query) */}
                    {query.length < 2 && (
                        <div className="py-2">
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        ค้นหาล่าสุด
                                    </div>
                                    <div className="flex flex-wrap gap-2 px-4">
                                        {recentSearches.map((search, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setQuery(search)
                                                    performSearch(search)
                                                }}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-600 transition-colors"
                                            >
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular Searches */}
                            <div>
                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    คำค้นหายอดนิยม
                                </div>
                                <div className="flex flex-wrap gap-2 px-4 pb-4">
                                    {popularSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setQuery(search)
                                                performSearch(search)
                                            }}
                                            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-100 rounded-full text-sm text-blue-600 font-medium transition-colors"
                                        >
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
