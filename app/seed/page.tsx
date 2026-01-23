'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SeedPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('กรุณาเลือกไฟล์ JSON เพื่ออัปเดตโลโก้')
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0])
  }

  const runUpdateLogo = async () => {
    if (!file) return alert('กรุณาเลือกไฟล์ก่อน!')

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const rawData = JSON.parse(e.target?.result as string)

        // กรองเอาเฉพาะรายชื่อมหาลัยที่ไม่ซ้ำกันในไฟล์ JSON เพื่อลดจำนวนครั้งที่ยิงไปที่ DB
        const uniqueUnis = Array.from(new Set(rawData.map((item: any) => item.university_name_th)))
          .map(name => {
            return rawData.find((item: any) => item.university_name_th === name)
          })

        const total = uniqueUnis.length

        for (let i = 0; i < total; i++) {
          const item = uniqueUnis[i]
          const uniName = item.university_name_th?.trim()
          const uniId = item.university_id // เช่น "001"

          if (!uniName || !uniId) continue

          // สร้าง URL ตามที่คุณต้องการ
          const logoUrl = `https://assets.mytcas.com/i/logo/${uniId}.png`

          const percent = Math.round(((i + 1) / total) * 100)
          setProgress(percent)
          setStatus(`อัปเดตโลโก้: ${i + 1}/${total} - ${uniName}`)

          // อัปเดตเฉพาะ logo_url ในตาราง universities ที่ชื่อตรงกัน
          const { error } = await supabase
            .from('universities')
            .update({ logo_url: logoUrl })
            .eq('name_th', uniName)

          if (error) console.error(`Error updating ${uniName}:`, error)
        }

        setStatus('✅ อัปเดตโลโก้มหาวิทยาลัยครบถ้วนแล้ว!')
      } catch (err: any) {
        setStatus(`❌ เกิดข้อผิดพลาด: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="bg-emerald-600 text-white rounded-t-xl text-center">
          <CardTitle>🖼️ University Logo Updater</CardTitle>
          <p className="text-sm opacity-90 mt-2">อัปเดตเฉพาะรูปตรามหาลัยจาก MyTCAS</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <Input type="file" accept=".json" onChange={handleFileChange} disabled={loading} />

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-slate-600 text-center font-medium">{status}</p>
          </div>

          <Button
            onClick={runUpdateLogo}
            disabled={loading || !file}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {loading ? '⏳ กำลังอัปเดต...' : 'เริ่มอัปเดตโลโก้ (Start Update)'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}