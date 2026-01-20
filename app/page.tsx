'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, GraduationCap, ShieldCheck } from 'lucide-react'

// Type สำหรับข้อมูลมหาลัย
interface University {
  id: string
  name_th: string
  type: string
  logo_url?: string
}

export default function Home() {
  const [universities, setUniversities] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  // 1. โหลดข้อมูล User และ รายชื่อมหาลัย
  useEffect(() => {
    const fetchData = async () => {
      // เช็ค User
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // ถ้ามี User ให้เช็คว่าเป็น Admin ไหม
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }

      // ดึงข้อมูลมหาลัยทั้งหมด
      const { data: unis } = await supabase
        .from('universities')
        .select('*')
        .order('created_at', { ascending: false })

      if (unis) setUniversities(unis)
    }
    fetchData()
  }, [])

  // 2. ระบบค้นหา (Filter)
  const filteredUnis = universities.filter(uni =>
    uni.name_th.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* --- Navbar --- */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <GraduationCap /> UniReview
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost">👑 ระบบหลังบ้าน</Button>
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border" alt="Profile" />
                <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button>เข้าสู่ระบบ</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="bg-indigo-600 text-white py-20 px-4">
        <div className="container mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">รีวิวมหาวิทยาลัยที่ "จริงใจ" 💖</h1>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
            ค้นหาข้อมูล รีวิวจากรุ่นพี่ และเปรียบเทียบหลักสูตร เพื่ออนาคตที่ดีที่สุดของคุณ
          </p>

          {/* ช่องค้นหาใหญ่ๆ */}
          <div className="max-w-xl mx-auto relative text-slate-900">
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <Input
              className="pl-10 h-12 text-lg rounded-full shadow-lg border-0"
              placeholder="ค้นหาชื่อมหาวิทยาลัย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- University Grid --- */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="text-indigo-600" />
          <h2 className="text-2xl font-bold">มหาวิทยาลัยยอดนิยม</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnis.map((uni) => (
            <Link href={`/university/${uni.id}`} key={uni.id} className="group">
              <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 border-indigo-50 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                  {/* ถ้ามี Logo ให้โชว์ ถ้าไม่มีให้โชว์ไอคอน */}
                  {uni.logo_url ? (
                    <img src={uni.logo_url} alt={uni.name_th} className="h-20 object-contain" />
                  ) : (
                    <GraduationCap className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${uni.type === 'Public' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {uni.type === 'Public' ? 'รัฐบาล' : 'เอกชน'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-indigo-600 transition-colors">
                    {uni.name_th}
                  </h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
                    <MapPin className="w-4 h-4" /> ดูคณะและสาขา
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredUnis.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              ไม่พบมหาวิทยาลัยที่คุณค้นหา...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}