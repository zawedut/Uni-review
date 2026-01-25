'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, ChevronRight, Building2, Star, Search } from 'lucide-react'
import GlobalSearch from '@/components/GlobalSearch'

interface University {
  id: string
  name_th: string
  type: string
  logo_url?: string
}

export default function Home() {
  const [universities, setUniversities] = useState<University[]>([])
  const [stats, setStats] = useState({ faculties: 0, programs: 0 })
  const [uniStats, setUniStats] = useState<Record<string, { rating: number, count: number }>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Fetch Universities
      const { data: unis } = await supabase
        .from('universities')
        .select('*')
        .order('name_th')

      if (unis) setUniversities(unis)

      // Fetch Stats Counts
      const [facs, progs] = await Promise.all([
        supabase.from('faculties').select('id', { count: 'exact', head: true }),
        supabase.from('programs').select('id', { count: 'exact', head: true })
      ])

      setStats({
        faculties: facs.count || 0,
        programs: progs.count || 0
      })

      // Fetch Reviews for rating calculation
      // Note: In a real large production app, this should be done via a database view or RPC
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          rating_academic,
          rating_social,
          rating_facility,
          programs (
            departments (
              faculties (
                university_id
              )
            )
          )
        `)

      if (reviews) {
        const statsMap: Record<string, { total: number, count: number }> = {}

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviews.forEach((r: any) => {
          const uniId = r.programs?.departments?.faculties?.university_id
          if (uniId) {
            if (!statsMap[uniId]) statsMap[uniId] = { total: 0, count: 0 }

            const avgReview = (r.rating_academic + r.rating_social + r.rating_facility) / 3
            statsMap[uniId].total += avgReview
            statsMap[uniId].count += 1
          }
        })

        const finalStats: Record<string, { rating: number, count: number }> = {}
        Object.keys(statsMap).forEach(uniId => {
          finalStats[uniId] = {
            rating: Number((statsMap[uniId].total / statsMap[uniId].count).toFixed(1)),
            count: statsMap[uniId].count
          }
        })
        setUniStats(finalStats)
      }

      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredUnis = universities.filter(uni =>
    uni.name_th.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">

            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
              ค้นหา<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">มหาวิทยาลัย</span>ที่ใช่
              <br />สำหรับคุณ
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              ค้นหามหาวิทยาลัย คณะ หลักสูตร อ่านรีวิวจากนักศึกษาจริง ตัดสินใจได้อย่างมั่นใจ
            </p>

            {/* Global Search Box */}
            <div className="max-w-2xl mx-auto relative z-50">
              <GlobalSearch
                placeholder="พิมพ์ค้นหา... เช่น จุฬา, วิศวะ, แพทย์, เศรษฐศาสตร์"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {universities.length}
                </div>
                <div className="text-sm text-slate-500 font-medium">มหาวิทยาลัย</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {stats.faculties}
                </div>
                <div className="text-sm text-slate-500 font-medium">คณะ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {stats.programs}
                </div>
                <div className="text-sm text-slate-500 font-medium">หลักสูตร</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University List */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 text-center md:text-left">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                <Building2 className="w-8 h-8 text-blue-600" />
                มหาวิทยาลัยทั้งหมด
              </h2>
              <p className="text-slate-500">เลือกดูรายละเอียดและรีวิวของแต่ละมหาวิทยาลัย</p>
            </div>
            <span className="px-4 py-2 rounded-full bg-white shadow-md text-sm font-bold text-blue-600">
              {filteredUnis.length} แห่ง
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-white/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUnis.map((uni) => (
                <Link href={`/university/${uni.id}`} key={uni.id}>
                  <Card className="group h-full hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden hover:-translate-y-1">
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <CardContent className="p-6 relative">
                      <div className="flex items-start gap-5">
                        {/* Logo */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 shadow-inner group-hover:shadow-lg transition-shadow">
                          {uni.logo_url ? (
                            <img src={uni.logo_url} alt="" className="w-14 h-14 object-contain" />
                          ) : (
                            <GraduationCap className="w-10 h-10 text-slate-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                            {uni.name_th}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${uni.type === 'Public'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200/50'
                            : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200/50'
                            }`}>
                            {uni.type === 'Public' ? '🏛️ รัฐบาล' : '🏢 เอกชน'}
                          </span>

                          {/* Preview Stats */}
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Star className={`w-3.5 h-3.5 ${uniStats[uni.id] ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                              {uniStats[uni.id]?.rating || '0.0'}
                            </span>
                            <span>•</span>
                            <span>{uniStats[uni.id]?.count || 0} รีวิว</span>
                          </div>
                        </div>

                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredUnis.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-slate-500 text-lg">ไม่พบมหาวิทยาลัยที่ค้นหา</p>
              <p className="text-slate-400 text-sm mt-2">ลองค้นหาด้วยคำอื่น</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            พร้อมแชร์ประสบการณ์ของคุณหรือยัง?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            รีวิวของคุณจะช่วยให้น้องๆ ตัดสินใจเลือกมหาวิทยาลัยได้ดีขึ้น
          </p>
          <Link href="/login">
            <button className="px-8 py-4 rounded-full bg-white text-blue-600 font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              🚀 เริ่มเขียนรีวิว
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">Buddy Review</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 Buddy Review - แพลตฟอร์มรีวิวมหาวิทยาลัยไทย
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}