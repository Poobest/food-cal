# คู่มือการสร้างและ Deploy LINE LIFF Food Tracker

## ภาพรวมระบบ

LINE LIFF App สำหรับติดตามสารอาหารประจำวัน ผู้ใช้ส่งรูปอาหารผ่าน LINE Chat → AI วิเคราะห์ → บันทึกสารอาหารอัตโนมัติ → ดู Dashboard บน LIFF

```
LINE Chat (Webhook) ──→ /api/webhook/line ──→ Prisma ──→ Supabase PostgreSQL
LINE LIFF (Dashboard) → /api/dashboard    ──→ Prisma ──→ Supabase PostgreSQL
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma 7 |
| Auth | LINE LIFF (userId) |
| AI Vision | OpenRouter.ai |
| Food Data | USDA FoodData Central |
| Deploy | Vercel |

---

## ขั้นตอนที่ 1 — วางแผนโปรเจกต์

ก่อนเขียนโค้ดให้เตรียมเอกสารดังนี้:

- **`docs/PRD.md`** — Product Requirements: User Stories, Tech Stack, Database Schema
- **`docs/adr/`** — Architecture Decision Records: บันทึกทำไมถึงเลือก tech นั้น
- **`CONTEXT.md`** — Domain Glossary: นิยามศัพท์เฉพาะของระบบ (TDEE, Meal Log, NutritionGoal ฯลฯ)

---

## ขั้นตอนที่ 2 — Setup โปรเจกต์

```bash
npx create-next-app@latest food-cal --typescript --tailwind --app
cd food-cal

# Dependencies หลัก
pnpm add @prisma/client prisma @prisma/adapter-pg pg
pnpm add @line/liff bcryptjs jsonwebtoken
pnpm add -D @types/pg @types/bcryptjs @types/jsonwebtoken vitest
```

---

## ขั้นตอนที่ 3 — Database (Supabase + Prisma)

### 3.1 สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) → New Project
2. Settings → Database → Connection string → เอา `DATABASE_URL`

### 3.2 เขียน Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id              String           @id @default(cuid())
  lineUserId      String           @unique
  createdAt       DateTime         @default(now())
  profile         Profile?
  nutritionGoal   NutritionGoal?
  onboardingState OnboardingState?
  mealLogs        MealLog[]
  @@map("users")
}

model Profile {
  id            String  @id @default(cuid())
  userId        String  @unique
  user          User    @relation(fields: [userId], references: [id])
  gender        String
  age           Int
  weightKg      Float
  heightCm      Float
  activityLevel String
  goalType      String
  @@map("profiles")
}

model NutritionGoal {
  id           String @id @default(cuid())
  userId       String @unique
  user         User   @relation(fields: [userId], references: [id])
  calories     Float
  protein      Float
  carbs        Float
  fiber        Float
  sugar        Float
  fat          Float
  saturatedFat Float
  sodium       Float
  @@map("nutrition_goals")
}

model MealLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  foodName     String
  quantityG    Float
  calories     Float
  protein      Float
  carbs        Float
  fiber        Float
  sugar        Float
  fat          Float
  saturatedFat Float
  sodium       Float
  loggedAt     DateTime @default(now())
  @@map("meal_logs")
}
```

### 3.3 Push Schema และ Generate Client

```bash
pnpm prisma db push      # สร้าง tables ใน Supabase
pnpm prisma generate     # generate Prisma Client
```

### 3.4 Prisma Client (Prisma 7 — ต้องใช้ Driver Adapter)

> **Breaking Change ใน Prisma 7:** default engine เปลี่ยนเป็น "client" (WASM-based)
> ต้องใช้ `@prisma/adapter-pg` สำหรับ direct PostgreSQL connection

```ts
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## ขั้นตอนที่ 4 — Backend (LINE Webhook)

### โครงสร้างไฟล์

```
src/
├── lib/
│   ├── tdee/
│   │   ├── calculateTDEE.ts          # คำนวณ TDEE (Mifflin-St Jeor)
│   │   └── calculateNutritionGoal.ts # แปลง TDEE → nutrition targets
│   ├── ai/
│   │   └── recognizeFood.ts          # OpenRouter.ai vision API
│   ├── usda/
│   │   └── searchFood.ts             # USDA FoodData Central API
│   ├── meal/
│   │   ├── scaledNutrients.ts        # คำนวณสารอาหารตาม quantity
│   │   └── authorizeMealLog.ts       # ตรวจสิทธิ์ลบ meal log
│   ├── summary/
│   │   └── summarizeDay.ts           # aggregate สารอาหารรายวัน
│   └── line/
│       ├── reply.ts                  # helper ส่ง reply ไปยัง LINE
│       └── signature.ts             # ตรวจ HMAC-SHA256 signature
└── app/
    └── api/
        ├── webhook/line/
        │   └── route.ts              # LINE Webhook handler
        └── dashboard/
            └── route.ts              # Dashboard data API
```

### การพัฒนาด้วย TDD (Red → Green → Refactor)

สำหรับทุก module ให้เขียน test ก่อน แล้วค่อย implement:

```bash
# 1. เขียน test (RED)
# 2. รัน test → ต้อง FAIL
pnpm test

# 3. เขียน implementation (GREEN)
# 4. รัน test → ต้อง PASS
pnpm test

# 5. Refactor
```

### Webhook Route Handler Pattern

```ts
// src/app/api/webhook/line/route.ts
export async function POST(req: NextRequest) {
  // 1. Verify LINE signature
  const signature = req.headers.get('x-line-signature') ?? ''
  const body = await req.text()
  if (!verifySignature(body, signature, process.env.LINE_CHANNEL_SECRET ?? ''))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })

  // 2. Parse events
  const { events } = JSON.parse(body)
  await Promise.all(events.map(handleEvent))
  return NextResponse.json({ status: 'ok' })
}
```

---

## ขั้นตอนที่ 5 — Frontend (LIFF Dashboard)

### Dashboard API

```ts
// src/app/api/dashboard/route.ts
export const dynamic = 'force-dynamic'  // ต้องใส่ไม่งั้น Next.js จะ static render

export async function GET(request: Request) {
  const lineUserId = new URL(request.url).searchParams.get('lineUserId')
  // ... fetch user, mealLogs, nutritionGoal
  // ... return summarizeDay(mealLogs, nutritionGoal)
}
```

### Dashboard Component (LIFF Auth Flow)

```ts
// src/app/_components/Dashboard.tsx
'use client'

useEffect(() => {
  async function init() {
    const liff = (await import('@line/liff')).default
    await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
    if (!liff.isLoggedIn()) { liff.login(); return }
    const profile = await liff.getProfile()
    // fetch /api/dashboard?lineUserId=...
  }
  init()
}, [])
```

> **หมายเหตุ:** ใช้ `dynamic import` สำหรับ `@line/liff` เพราะเป็น browser-only library

---

## ขั้นตอนที่ 6 — Deploy บน Vercel

### 6.1 ติดตั้ง Vercel CLI และ Login

```bash
npm install -g vercel
vercel login    # เปิด browser อนุมัติ device
```

### 6.2 Link Project

```bash
vercel link --yes
```

### 6.3 เพิ่ม Environment Variables

เพิ่มผ่าน Vercel Dashboard หรือ CLI:

```bash
echo "your-value" | vercel env add VARIABLE_NAME production
```

Environment variables ที่ต้องใช้ทั้งหมด:

| Variable | ดูได้จากที่ไหน |
|----------|--------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string |
| `LINE_CHANNEL_SECRET` | LINE Developers Console → Basic settings → Channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers Console → Messaging API → Channel access token |
| `USDA_API_KEY` | [fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-guide.html) → Get API Key |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | เช่น `openai/gpt-4o-mini` |
| `NEXT_PUBLIC_LIFF_ID` | LINE Developers Console → LIFF → LIFF ID |

### 6.4 แก้ Build Script (สำคัญมาก)

Vercel block การรัน postinstall scripts ของ pnpm ทำให้ `prisma generate` ไม่รันอัตโนมัติ
ต้องเพิ่มใน `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### 6.5 Deploy

```bash
vercel --prod --yes
```

---

## ขั้นตอนที่ 7 — ตั้งค่า LINE Developers Console

### 7.1 Webhook (Chatbot)

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Messaging API channel
3. Messaging API tab → Webhook settings
4. Webhook URL: `https://your-app.vercel.app/api/webhook/line`
5. กด **Verify** → ต้องได้ Success
6. เปิด **Use webhook**

### 7.2 LIFF (Dashboard)

1. ไปที่ channel เดียวกัน → **LIFF** tab
2. เพิ่ม LIFF app:
   - Name: Food Tracker Dashboard
   - Size: Full
   - Endpoint URL: `https://your-app.vercel.app`
   - Scope: profile
3. เอา **LIFF ID** ที่ได้ → ใส่ใน Vercel env `NEXT_PUBLIC_LIFF_ID`
4. Redeploy: `vercel --prod --yes`

---

## การทดสอบ End-to-End

```
1. เพิ่ม LINE Bot เป็นเพื่อน
2. พิมพ์ "เริ่ม" → ทำ Onboarding (เพศ / อายุ / น้ำหนัก / ส่วนสูง / กิจกรรม / เป้าหมาย)
3. ถ่ายรูปอาหาร → ส่งใน LINE Chat → AI วิเคราะห์ → พิมพ์ปริมาณ → บันทึก
4. พิมพ์ "สรุป" → ดูสรุปสารอาหารวันนี้ผ่าน Chat
5. เปิด LIFF URL → ดู Dashboard พร้อม progress bars
```

---

## คำสั่งที่ใช้บ่อย

```bash
# พัฒนา local
pnpm dev

# รัน tests
pnpm test

# Push schema changes ไป Supabase
pnpm prisma db push

# Deploy production
vercel --prod --yes

# ดู Vercel logs
vercel logs --prod
```
