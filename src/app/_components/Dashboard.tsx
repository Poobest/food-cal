'use client'

import { useEffect, useState } from 'react'
import type { DailySummary } from '@/lib/summary/summarizeDay'

type MealLog = {
  id: string
  foodName: string
  quantityG: number
  calories: number
  loggedAt: string
}

type DashboardData = {
  summary: DailySummary
  mealLogs: MealLog[]
}

type Status = 'init' | 'loading' | 'ready' | 'error' | 'no-profile'

const NUTRIENT_LABELS: Record<string, { label: string; unit: string }> = {
  calories: { label: 'แคลอรี่', unit: 'kcal' },
  protein: { label: 'โปรตีน', unit: 'g' },
  carbs: { label: 'คาร์โบไฮเดรต', unit: 'g' },
  fat: { label: 'ไขมัน', unit: 'g' },
  fiber: { label: 'ใยอาหาร', unit: 'g' },
  sugar: { label: 'น้ำตาล', unit: 'g' },
  saturatedFat: { label: 'ไขมันอิ่มตัว', unit: 'g' },
  sodium: { label: 'โซเดียม', unit: 'mg' },
}

function ProgressBar({ actual, goal, accent = false }: { actual: number; goal: number; accent?: boolean }) {
  const pct = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0
  const over = pct >= 100
  return (
    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : accent ? 'bg-emerald-500' : 'bg-blue-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function NutrientCard({ name, actual, goal, unit }: { name: string; actual: number; goal: number; unit: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0
  const over = pct >= 100
  return (
    <div className="bg-white rounded-xl p-3 border border-zinc-100 shadow-sm">
      <div className="text-xs text-zinc-500 mb-1">{name}</div>
      <div className={`text-base font-semibold ${over ? 'text-rose-600' : 'text-zinc-800'}`}>
        {actual} <span className="text-xs font-normal text-zinc-400">/ {goal} {unit}</span>
      </div>
      <div className="mt-1.5">
        <ProgressBar actual={actual} goal={goal} />
      </div>
      <div className="text-xs text-right mt-0.5 text-zinc-400">{pct}%</div>
    </div>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function todayThai() {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status>('init')
  const [data, setData] = useState<DashboardData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function init() {
      setStatus('loading')
      try {
        const liff = (await import('@line/liff')).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        await fetchDashboard(profile.userId)
      } catch {
        setStatus('error')
        setErrorMsg('ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาเปิดจากแอป LINE')
      }
    }

    async function fetchDashboard(lineUserId: string) {
      const res = await fetch(`/api/dashboard?lineUserId=${encodeURIComponent(lineUserId)}`)
      if (res.status === 404) {
        setStatus('no-profile')
        return
      }
      if (!res.ok) {
        setStatus('error')
        setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูล')
        return
      }
      const json = await res.json()
      setData(json)
      setStatus('ready')
    }

    init()
  }, [])

  if (status === 'init' || status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-zinc-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">กำลังโหลด...</span>
      </div>
    )
  }

  if (status === 'no-profile') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="text-4xl">🥗</div>
        <h2 className="text-lg font-semibold text-zinc-800">ยังไม่ได้ตั้งค่า Profile</h2>
        <p className="text-sm text-zinc-500">กรุณาทำ Onboarding ผ่าน LINE Chat ก่อนใช้งาน</p>
        <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2">พิมพ์ <strong>เริ่ม</strong> ใน LINE Chat</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-zinc-600">{errorMsg}</p>
      </div>
    )
  }

  if (!data) return null

  const { summary, mealLogs } = data
  const calPct = summary.calories.goal > 0
    ? Math.min(100, Math.round((summary.calories.actual / summary.calories.goal) * 100))
    : 0
  const calOver = calPct >= 100

  return (
    <div className="min-h-screen bg-zinc-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-4 pt-6 pb-4 shadow-sm">
        <h1 className="text-lg font-bold text-zinc-800">สรุปสารอาหารวันนี้</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{todayThai()}</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Calories hero */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-zinc-600">แคลอรี่</span>
            <span className="text-xs text-zinc-400">เป้าหมาย {summary.calories.goal} kcal</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${calOver ? 'text-rose-600' : 'text-zinc-900'}`}>
            {summary.calories.actual}
            <span className="text-base font-normal text-zinc-400"> kcal</span>
          </div>
          <ProgressBar actual={summary.calories.actual} goal={summary.calories.goal} accent />
          <div className="flex justify-between mt-1.5 text-xs text-zinc-400">
            <span>{calPct}% ของเป้าหมาย</span>
            <span className={calOver ? 'text-rose-500 font-medium' : ''}>
              {calOver
                ? `เกิน ${Math.abs(summary.calories.remaining)} kcal`
                : `เหลือ ${summary.calories.remaining} kcal`}
            </span>
          </div>
        </div>

        {/* Macros grid */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 mb-2 px-0.5">สารอาหารหลัก</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['protein', 'carbs', 'fat', 'sodium'] as const).map((key) => (
              <NutrientCard
                key={key}
                name={NUTRIENT_LABELS[key].label}
                actual={summary[key].actual}
                goal={summary[key].goal}
                unit={NUTRIENT_LABELS[key].unit}
              />
            ))}
          </div>
        </div>

        {/* Detail nutrients */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 mb-2 px-0.5">สารอาหารเพิ่มเติม</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['fiber', 'sugar', 'saturatedFat'] as const).map((key) => (
              <NutrientCard
                key={key}
                name={NUTRIENT_LABELS[key].label}
                actual={summary[key].actual}
                goal={summary[key].goal}
                unit={NUTRIENT_LABELS[key].unit}
              />
            ))}
          </div>
        </div>

        {/* Meal log list */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 mb-2 px-0.5">
            มื้ออาหารวันนี้ ({mealLogs.length} รายการ)
          </h2>
          {mealLogs.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center text-sm text-zinc-400 border border-zinc-100">
              ยังไม่มีบันทึกมื้ออาหาร
            </div>
          ) : (
            <div className="space-y-2">
              {mealLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl px-4 py-3 flex justify-between items-center border border-zinc-100 shadow-sm">
                  <div>
                    <div className="text-sm font-medium text-zinc-800">{log.foodName}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{log.quantityG} g · {formatTime(log.loggedAt)}</div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">{Math.round(log.calories)} kcal</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="text-center text-xs text-zinc-400 bg-white rounded-xl py-3 border border-zinc-100">
          📲 บันทึกมื้ออาหารผ่าน LINE Chat ได้เลย
        </div>
      </div>
    </div>
  )
}
