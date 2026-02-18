'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Building2, BookOpen, ChevronRight } from 'lucide-react'

export default function WriteReviewPage() {
    const router = useRouter()
    const supabase = createClient()

    const [universities, setUniversities] = useState<any[]>([])
    const [faculties, setFaculties] = useState<any[]>([])
    const [programs, setPrograms] = useState<any[]>([])

    const [selectedUni, setSelectedUni] = useState('')
    const [selectedFaculty, setSelectedFaculty] = useState('')
    const [selectedProgram, setSelectedProgram] = useState('')

    const [loading, setLoading] = useState(true)
    const [loadingFaculties, setLoadingFaculties] = useState(false)
    const [loadingPrograms, setLoadingPrograms] = useState(false)

    // Auth guard: redirect to login if not logged in
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login?redirectTo=/write')
                return
            }
            setLoading(false)
        }
        checkAuth()
    }, [supabase, router])

    // Fetch Universities after auth check passes
    useEffect(() => {
        if (loading) return
        const fetchUniversities = async () => {
            const { data } = await supabase
                .from('universities')
                .select('id, name_th')
                .order('name_th')
            
            if (data) setUniversities(data)
        }
        fetchUniversities()
    }, [loading, supabase])

    // Fetch Faculties when Uni changes
    useEffect(() => {
        if (!selectedUni) {
            setFaculties([])
            setSelectedFaculty('')
            setPrograms([])
            setSelectedProgram('')
            return
        }

        const fetchFaculties = async () => {
            setLoadingFaculties(true)
            const { data } = await supabase
                .from('faculties')
                .select('id, name_th')
                .eq('university_id', selectedUni)
                .order('name_th')
            
            if (data) setFaculties(data)
            setLoadingFaculties(false)
        }
        fetchFaculties()
    }, [selectedUni, supabase])

    // Fetch Programs when Faculty changes
    useEffect(() => {
        if (!selectedFaculty) {
            setPrograms([])
            setSelectedProgram('')
            return
        }

        const fetchPrograms = async () => {
            setLoadingPrograms(true)
            const { data } = await supabase
                .from('programs')
                .select(`
                    id,
                    name_th,
                    departments!inner (
                        id,
                        faculty_id
                    )
                `)
                .eq('departments.faculty_id', selectedFaculty)
                .order('name_th')
            
            if (data) setPrograms(data)
            setLoadingPrograms(false)
        }
        fetchPrograms()
    }, [selectedFaculty, supabase])

    const handleNext = () => {
        if (selectedProgram) {
            router.push(`/program/${selectedProgram}?action=review`)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-4">เขียนรีวิว</h1>
                    <p className="text-slate-500">เลือกสาขาที่คุณต้องการรีวิวเพื่อส่งต่อประสบการณ์ให้น้องๆ</p>
                </div>

                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl p-6">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <PenLineIcon className="w-5 h-5" />
                            ข้อมูลการศึกษา
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        
                        {/* Step 1: University */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                                มหาวิทยาลัย
                            </label>
                            <Select value={selectedUni} onValueChange={setSelectedUni}>
                                <SelectTrigger className="h-12 w-full bg-white border-slate-200 focus:ring-blue-500">
                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate text-left flex-1 pr-2">
                                            <SelectValue placeholder="เลือกมหาวิทยาลัย" />
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {universities.map(uni => (
                                        <SelectItem 
                                            key={uni.id} 
                                            value={uni.id}
                                            className="whitespace-normal break-words py-2 text-left"
                                        >
                                            {uni.name_th}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 2: Faculty */}
                        <div className={`space-y-2 transition-opacity duration-300 ${!selectedUni ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                                คณะ
                            </label>
                            <Select value={selectedFaculty} onValueChange={setSelectedFaculty} disabled={!selectedUni}>
                                <SelectTrigger className="h-12 w-full bg-white border-slate-200 focus:ring-blue-500">
                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                        <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate text-left flex-1 pr-2">
                                            <SelectValue placeholder={loadingFaculties ? "กำลังโหลด..." : "เลือกคณะ"} />
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {faculties.map(fac => (
                                        <SelectItem 
                                            key={fac.id} 
                                            value={fac.id}
                                            className="whitespace-normal break-words py-2 text-left"
                                        >
                                            {fac.name_th}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Step 3: Program */}
                        <div className={`space-y-2 transition-opacity duration-300 ${!selectedFaculty ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">3</span>
                                สาขาวิชา / หลักสูตร
                            </label>
                            <Select value={selectedProgram} onValueChange={setSelectedProgram} disabled={!selectedFaculty}>
                                <SelectTrigger className="h-12 w-full bg-white border-slate-200 focus:ring-blue-500">
                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate text-left flex-1 pr-2">
                                            <SelectValue placeholder={loadingPrograms ? "กำลังโหลด..." : "เลือกสาขา"} />
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {programs.map(prog => (
                                        <SelectItem 
                                            key={prog.id} 
                                            value={prog.id}
                                            className="whitespace-normal break-words py-2 text-left leading-tight"
                                        >
                                            {prog.name_th}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <Button 
                                onClick={handleNext}
                                disabled={!selectedProgram}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]"
                            >
                                ถัดไป (Next)
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function PenLineIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    )
}