import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/line/signature'
import { replyMessage } from '@/lib/line/reply'
import { prisma } from '@/lib/db/prisma'
import { calculateTDEE } from '@/lib/tdee/calculateTDEE'
import { calculateNutritionGoal } from '@/lib/tdee/calculateNutritionGoal'
import { recognizeFoodFromImage } from '@/lib/ai/recognizeFood'
import { searchFood } from '@/lib/usda/searchFood'
import { summarizeDay } from '@/lib/summary/summarizeDay'
import type { ActivityLevel, Gender, GoalType } from '@/lib/tdee/calculateTDEE'

const ONBOARDING_STEPS = ['gender', 'age', 'weight', 'height', 'activity', 'goal'] as const
type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

const STEP_QUESTIONS: Record<OnboardingStep, object> = {
  gender: { type: 'text', text: 'สวัสดี! เริ่มต้นด้วยการตั้งค่าโปรไฟล์ 😊\nคุณเป็น เพศ อะไร?', quickReply: { items: [{ type: 'action', action: { type: 'message', label: 'ชาย', text: 'ชาย' } }, { type: 'action', action: { type: 'message', label: 'หญิง', text: 'หญิง' } }] } },
  age: { type: 'text', text: 'อายุ ของคุณกี่ปี? (เช่น 25)' },
  weight: { type: 'text', text: 'น้ำหนัก ของคุณกี่กิโลกรัม? (เช่น 65)' },
  height: { type: 'text', text: 'ส่วนสูง ของคุณกี่เซนติเมตร? (เช่น 170)' },
  activity: { type: 'text', text: 'ระดับกิจกรรม ของคุณเป็นอย่างไร?', quickReply: { items: [{ type: 'action', action: { type: 'message', label: 'นั่งทำงาน', text: 'sedentary' } }, { type: 'action', action: { type: 'message', label: 'ออกกำลังเบา', text: 'light' } }, { type: 'action', action: { type: 'message', label: 'ออกกำลังปานกลาง', text: 'moderate' } }, { type: 'action', action: { type: 'message', label: 'ออกกำลังหนัก', text: 'active' } }, { type: 'action', action: { type: 'message', label: 'ออกกำลังหนักมาก', text: 'very_active' } }] } },
  goal: { type: 'text', text: 'เป้าหมาย ของคุณคืออะไร?', quickReply: { items: [{ type: 'action', action: { type: 'message', label: 'ลดน้ำหนัก', text: 'ลดน้ำหนัก' } }, { type: 'action', action: { type: 'message', label: 'รักษาน้ำหนัก', text: 'รักษาน้ำหนัก' } }, { type: 'action', action: { type: 'message', label: 'เพิ่มน้ำหนัก', text: 'เพิ่มน้ำหนัก' } }] } },
}

const GENDER_MAP: Record<string, Gender> = { ชาย: 'male', หญิง: 'female' }
const GOAL_MAP: Record<string, GoalType> = { ลดน้ำหนัก: 'lose', รักษาน้ำหนัก: 'maintain', เพิ่มน้ำหนัก: 'gain' }

async function handleOnboarding(userId: string, replyToken: string, text: string) {
  const user = await prisma.user.upsert({
    where: { lineUserId: userId },
    update: {},
    create: { lineUserId: userId },
  })

  const state = await prisma.onboardingState.findUnique({ where: { userId: user.id } })
  const currentStep = (state?.step ?? 'gender') as OnboardingStep

  const partialProfile: Record<string, string | number> = {}

  if (currentStep === 'gender') {
    partialProfile.gender = GENDER_MAP[text] ?? 'male'
  } else if (currentStep === 'age') {
    partialProfile.age = parseInt(text)
  } else if (currentStep === 'weight') {
    partialProfile.weightKg = parseFloat(text)
  } else if (currentStep === 'height') {
    partialProfile.heightCm = parseFloat(text)
  } else if (currentStep === 'activity') {
    partialProfile.activityLevel = text as ActivityLevel
  } else if (currentStep === 'goal') {
    const goalType = GOAL_MAP[text] ?? 'maintain'
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { goalType },
      create: { userId: user.id, gender: 'male', age: 25, weightKg: 60, heightCm: 165, activityLevel: 'sedentary', goalType },
    })
    const calories = calculateTDEE({
      gender: profile.gender as Gender,
      age: profile.age,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      activityLevel: profile.activityLevel as ActivityLevel,
      goalType: profile.goalType as GoalType,
    })
    const goal = calculateNutritionGoal({ calories, weightKg: profile.weightKg })
    await prisma.nutritionGoal.upsert({
      where: { userId: user.id },
      update: goal,
      create: { userId: user.id, ...goal },
    })
    const msg = `🎯 TDEE ของคุณคือ ${Math.round(calories)} kcal/วัน\n\nเป้าหมายสารอาหารต่อวัน:\n• โปรตีน: ${goal.protein}g\n• คาร์บ: ${goal.carbs}g\n• ไขมัน: ${goal.fat}g\n\nพร้อมแล้ว! ส่งรูปอาหารหรือพิมพ์ชื่ออาหารเพื่อบันทึกมื้อ 🍽️`
    await replyMessage(replyToken, { type: 'text', text: msg })
    return
  }

  if (Object.keys(partialProfile).length > 0) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: partialProfile,
      create: { userId: user.id, gender: 'male', age: 25, weightKg: 60, heightCm: 165, activityLevel: 'sedentary', goalType: 'maintain', ...partialProfile },
    })
  }

  const nextIdx = ONBOARDING_STEPS.indexOf(currentStep) + 1
  const nextStep = ONBOARDING_STEPS[nextIdx] ?? 'goal'
  await prisma.onboardingState.upsert({
    where: { userId: user.id },
    update: { step: nextStep },
    create: { userId: user.id, step: nextStep },
  })
  await replyMessage(replyToken, STEP_QUESTIONS[nextStep])
}

async function handleMealLog(userId: string, replyToken: string, foodName: string, quantityG: number) {
  const user = await prisma.user.upsert({
    where: { lineUserId: userId },
    update: {},
    create: { lineUserId: userId },
  })

  const food = await searchFood(foodName)
  if (!food) {
    await replyMessage(replyToken, { type: 'text', text: `ไม่พบข้อมูลโภชนาการของ "${foodName}"` })
    return
  }

  const { scaledNutrients } = await import('@/lib/meal/scaledNutrients')
  const nutrients = scaledNutrients(food.nutrients, quantityG)

  await prisma.mealLog.create({
    data: {
      userId: user.id,
      foodName: food.name,
      quantityG,
      ...nutrients,
    },
  })

  const text = `✅ บันทึกแล้ว!\n\n🍽️ ${food.name} (${quantityG}g)\n• แคลอรี่: ${nutrients.calories} kcal\n• โปรตีน: ${nutrients.protein}g\n• คาร์บ: ${nutrients.carbs}g\n• ไขมัน: ${nutrients.fat}g`
  await replyMessage(replyToken, { type: 'text', text })
}

async function handleDailySummary(userId: string, replyToken: string) {
  const user = await prisma.user.upsert({
    where: { lineUserId: userId },
    update: {},
    create: { lineUserId: userId },
  })

  const goal = await prisma.nutritionGoal.findUnique({ where: { userId: user.id } })
  if (!goal) {
    await replyMessage(replyToken, { type: 'text', text: 'ยังไม่ได้ตั้งค่าเป้าหมายสารอาหาร พิมพ์ "เริ่มต้น" เพื่อตั้งค่าโปรไฟล์ก่อนนะคะ 😊' })
    return
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const logs = await prisma.mealLog.findMany({
    where: { userId: user.id, loggedAt: { gte: startOfDay } },
  })

  const summary = summarizeDay(logs, goal)
  const { calories: cal, protein: pro, carbs, fat, sodium } = summary

  const text = [
    '📊 สรุปสารอาหารวันนี้',
    '',
    `🔥 แคลอรี่:   ${cal.actual} / ${cal.goal} kcal (เหลือ ${cal.remaining})`,
    `🥩 โปรตีน:   ${pro.actual} / ${pro.goal} g`,
    `🍚 คาร์บ:     ${carbs.actual} / ${carbs.goal} g`,
    `🫒 ไขมัน:    ${fat.actual} / ${fat.goal} g`,
    `🧂 โซเดียม:  ${sodium.actual} / ${sodium.goal} mg`,
  ].join('\n')

  await replyMessage(replyToken, { type: 'text', text })
}

async function handleImageMessage(messageId: string, replyToken: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const buffer = Buffer.from(await res.arrayBuffer())

  const foodName = await recognizeFoodFromImage(buffer)
  if (!foodName) {
    await replyMessage(replyToken, { type: 'text', text: 'ไม่สามารถระบุอาหารจากรูปนี้ได้ ลองส่งรูปอื่นหรือพิมพ์ชื่ออาหารแทนได้เลย 😊' })
    return
  }

  const food = await searchFood(foodName)
  if (!food) {
    await replyMessage(replyToken, { type: 'text', text: `ไม่พบข้อมูลโภชนาการของ "${foodName}" ในฐานข้อมูล ลองพิมพ์ชื่ออาหารอีกครั้ง` })
    return
  }

  const { nutrients } = food
  const text = `🍽️ ${food.name}\n\nสารอาหารต่อ 100g:\n• แคลอรี่: ${nutrients.calories} kcal\n• โปรตีน: ${nutrients.protein}g\n• คาร์บ: ${nutrients.carbs}g\n• ไขมัน: ${nutrients.fat}g\n• โซเดียม: ${nutrients.sodium}mg\n\nต้องการบันทึกมื้อนี้ไหม?`
  await replyMessage(replyToken, {
    type: 'text',
    text,
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '100g', text: `log:${food.name}:100` } },
        { type: 'action', action: { type: 'message', label: '150g', text: `log:${food.name}:150` } },
        { type: 'action', action: { type: 'message', label: '200g', text: `log:${food.name}:200` } },
        { type: 'action', action: { type: 'message', label: 'ยกเลิก', text: 'ยกเลิก' } },
      ],
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''
  const secret = process.env.LINE_CHANNEL_SECRET ?? ''

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const { events } = JSON.parse(body)

  for (const event of events) {
    if (event.type === 'follow') {
      await prisma.user.upsert({
        where: { lineUserId: event.source.userId },
        update: {},
        create: { lineUserId: event.source.userId },
      })
      await replyMessage(event.replyToken, STEP_QUESTIONS.gender)
    } else if (event.type === 'message' && event.message.type === 'image') {
      await handleImageMessage(event.message.id, event.replyToken)
    } else if (event.type === 'message' && event.message.type === 'text') {
      const text: string = event.message.text
      if (text.startsWith('log:')) {
        const [, foodName, qty] = text.split(':')
        await handleMealLog(event.source.userId, event.replyToken, foodName, parseInt(qty))
      } else if (text === 'ยกเลิก') {
        await replyMessage(event.replyToken, { type: 'text', text: 'ยกเลิกแล้ว 👍 ส่งรูปอาหารหรือพิมพ์ชื่ออาหารใหม่ได้เลย' })
      } else if (text === 'สรุป') {
        await handleDailySummary(event.source.userId, event.replyToken)
      } else {
        await handleOnboarding(event.source.userId, event.replyToken, text)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
