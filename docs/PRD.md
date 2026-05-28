# PRD: แอปคำนวณสารอาหารบน LINE LIFF

**วันที่:** 2026-05-28  
**สถานะ:** Ready for Development

---

## ปัญหาที่ต้องการแก้ไข

ผู้ใช้ที่ต้องการดูแลสุขภาพหรือควบคุมน้ำหนักมักไม่รู้ว่าตัวเองได้รับสารอาหารเพียงพอหรือเกินเป้าหมายในแต่ละวันหรือไม่ การบันทึกอาหารด้วยวิธีดั้งเดิม (พิมพ์ชื่ออาหาร, กรอกตัวเลข) นั้นยุ่งยากและไม่สะดวก ทำให้ผู้ใช้ขาดความต่อเนื่องในการติดตาม ยิ่งไปกว่านั้น ผู้ใช้ส่วนใหญ่ไม่ทราบว่าตัวเองควรบริโภคพลังงานและสารอาหารเท่าไหร่ต่อวัน ตามลักษณะร่างกายและเป้าหมายสุขภาพของตน

---

## วิธีแก้ปัญหา

สร้าง LINE LIFF app ที่ให้ผู้ใช้ **ถ่ายรูปอาหาร** แล้วระบบจะวิเคราะห์ด้วย AI และบันทึกข้อมูลสารอาหารโดยอัตโนมัติ ระบบจะคำนวณ TDEE (พลังงานที่ร่างกายต้องการต่อวัน) จากข้อมูลร่างกายของผู้ใช้ และแนะนำเป้าหมายสารอาหารที่เหมาะสมกับเป้าหมาย ไม่ว่าจะเป็นการลดน้ำหนัก เพิ่มกล้ามเนื้อ หรือรักษาน้ำหนักปัจจุบัน ผู้ใช้จะเห็น Dashboard สรุปสารอาหารประจำวันทันทีเมื่อเปิด LINE

---

## User Stories

### การสมัครและเข้าสู่ระบบ

1. ในฐานะผู้ใช้ใหม่ ฉันต้องการสมัครสมาชิกด้วย email และรหัสผ่าน เพื่อให้ข้อมูลการบันทึกมื้ออาหารของฉันถูกเก็บไว้อย่างปลอดภัย
2. ในฐานะผู้ใช้ที่มีบัญชีแล้ว ฉันต้องการ login ด้วย email และรหัสผ่าน เพื่อเข้าถึงประวัติการบันทึกของฉัน
3. ในฐานะผู้ใช้ที่ login แล้ว ฉันต้องการ logout ได้ เพื่อปกป้องความปลอดภัยของบัญชี

### การ Onboarding และตั้งค่า Profile

4. ในฐานะผู้ใช้ใหม่ที่เพิ่งสมัคร ฉันต้องการให้ระบบถามข้อมูลร่างกายของฉัน (เพศ, อายุ, น้ำหนัก, ส่วนสูง) เพื่อให้ระบบสามารถคำนวณพลังงานที่ฉันต้องการได้
5. ในฐานะผู้ใช้ใหม่ ฉันต้องการเลือกระดับกิจกรรมประจำวัน (ออกกำลังกายน้อยถึงมาก) เพื่อให้การคำนวณ TDEE มีความแม่นยำ
6. ในฐานะผู้ใช้ใหม่ ฉันต้องการระบุเป้าหมายสุขภาพ (ลดน้ำหนัก / เพิ่มกล้ามเนื้อ / รักษาน้ำหนัก) เพื่อให้ระบบแนะนำเป้าหมายสารอาหารที่เหมาะสมกับฉัน
7. ในฐานะผู้ใช้ใหม่ที่ผ่าน onboarding แล้ว ฉันต้องการเห็นผล TDEE ที่คำนวณได้ และเป้าหมายสารอาหารประจำวันที่แนะนำ เพื่อทำความเข้าใจก่อนเริ่มใช้งาน
8. ในฐานะผู้ใช้ที่ใช้งานอยู่ ฉันต้องการแก้ไข Profile (น้ำหนัก, เป้าหมาย, ระดับกิจกรรม) ได้ เพื่อให้เป้าหมายสารอาหารสะท้อนการเปลี่ยนแปลงของร่างกายฉัน

### Dashboard และสรุปประจำวัน

9. ในฐานะผู้ใช้ที่เปิด LINE LIFF ฉันต้องการเห็น Dashboard ที่แสดงสารอาหารที่ฉันได้รับวันนี้ทันที เพื่อไม่ต้องเปิดหน้าจออื่น
10. ในฐานะผู้ใช้ที่ดู Dashboard ฉันต้องการเห็น progress bar ของแคลอรี่และ macronutrient หลัก เพื่อรู้ได้ทันทีว่าวันนี้ยังขาดหรือเกินเป้าหมายเท่าไหร่
11. ในฐานะผู้ใช้ที่ดู Dashboard ฉันต้องการเห็นรายการมื้ออาหารที่บันทึกไว้วันนี้ทั้งหมด เพื่อตรวจสอบสิ่งที่กินไปแล้ว
12. ในฐานะผู้ใช้ ฉันต้องการดูสรุปสารอาหารย้อนหลังในวันก่อนหน้าได้ เพื่อติดตาม pattern การกินของตัวเอง

### การบันทึกมื้ออาหารด้วยรูปภาพ

13. ในฐานะผู้ใช้ ฉันต้องการกดปุ่ม "บันทึกมื้ออาหาร" บน Dashboard เพื่อเริ่มกระบวนการบันทึกได้ง่าย
14. ในฐานะผู้ใช้ที่กำลังบันทึกมื้ออาหาร ฉันต้องการถ่ายรูปอาหารโดยตรงจาก LIFF หรืออัพโหลดรูปจาก gallery เพื่อความสะดวกในการบันทึก
15. ในฐานะผู้ใช้ที่ส่งรูปอาหารแล้ว ฉันต้องการให้ระบบวิเคราะห์และระบุชนิดอาหารโดยอัตโนมัติ เพื่อไม่ต้องพิมพ์ชื่ออาหารเอง
16. ในฐานะผู้ใช้ที่ระบบระบุอาหารแล้ว ฉันต้องการเห็นชื่ออาหารที่ AI วิเคราะห์ได้ พร้อมข้อมูลสารอาหารจาก USDA เพื่อยืนยันความถูกต้องก่อนบันทึก
17. ในฐานะผู้ใช้ ฉันต้องการระบุปริมาณที่กิน (กรัม หรือจำนวน serving) เพื่อให้ข้อมูลสารอาหารถูกต้องตามที่กินจริง
18. ในฐานะผู้ใช้ ฉันต้องการลบมื้ออาหารที่บันทึกผิดออกได้ เพื่อแก้ไขข้อผิดพลาด

### การแสดงผลสารอาหาร

19. ในฐานะผู้ใช้ ฉันต้องการเห็นสารอาหารหลักทั้งหมดต่อมื้อ ได้แก่ แคลอรี่, โปรตีน, คาร์โบไฮเดรต (รวม fiber และ sugar), ไขมัน (รวม saturated fat), และโซเดียม เพื่อข้อมูลที่ครบถ้วน
20. ในฐานะผู้ใช้ ฉันต้องการเห็นผลรวมสารอาหารทั้งวันเทียบกับเป้าหมาย Nutrition Goal ของฉัน เพื่อวางแผนมื้ออาหารที่เหลือของวัน

---

## การตัดสินใจด้านการพัฒนา

### Tech Stack
- **Framework:** Next.js (App Router) — frontend และ API routes อยู่ใน codebase เดียวกัน deploy บน Vercel
- **Database:** Supabase (PostgreSQL) + Prisma ORM — managed database พร้อม type-safe queries
- **Authentication:** Email/password ด้วย JWT — จัดการ session ผ่าน Next.js API routes
- **Platform:** LINE LIFF — app ทำงานภายใน LINE client ต้องมี HTTPS URL สาธารณะ (Vercel จัดการให้)
- **AI Vision:** OpenRouter.ai API — รับรูปอาหาร คืนชื่ออาหารที่ระบุได้
- **Food Data:** USDA FoodData Central API — ดึงข้อมูลสารอาหารตามชื่ออาหาร

### Modules หลัก

**1. Auth Module**
- Registration ด้วย email + password (hash ด้วย bcrypt)
- Login คืน JWT token
- Middleware ตรวจสอบ token ทุก protected route

**2. Profile & Onboarding Module**
- เก็บข้อมูล: `gender`, `age`, `weight_kg`, `height_cm`, `activity_level`, `goal_type`
- Onboarding flow: สร้าง Profile → trigger คำนวณ TDEE → สร้าง Nutrition Goal
- แก้ไข Profile ได้หลัง onboarding

**3. TDEE Calculator Module (Deep Module)**
- Input: Profile data
- คำนวณ BMR ด้วย Mifflin-St Jeor:
  - ชาย: `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5`
  - หญิง: `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161`
- คูณ Activity Multiplier (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
- ปรับตาม Goal Type:
  - `LOSE_WEIGHT`: TDEE − 500 kcal
  - `GAIN_MUSCLE`: TDEE + 300 kcal
  - `MAINTAIN`: TDEE
- คืน Nutrition Goal (calories, protein_g, carbs_g, fat_g, sodium_mg, fiber_g, sugar_g, saturated_fat_g)
- Pure function — ไม่มี side effects, test ได้อิสระ

**4. Food Recognition Module (Deep Module)**
- Input: รูปภาพ (base64 หรือ URL)
- ส่งไปยัง OpenRouter.ai API พร้อม prompt ให้ระบุชื่ออาหาร
- คืนชื่ออาหาร 1 รายการ (ภาษาอังกฤษ เพื่อ query USDA)
- จัดการ error กรณี AI ระบุไม่ได้

**5. USDA Food Search Module (Deep Module)**
- Input: ชื่ออาหาร (string)
- Query USDA FoodData Central API (`/foods/search`)
- Map ผลลัพธ์เป็น `FoodItem` ที่มีเฉพาะ Tracked Nutrients
- คืนผลลัพธ์แรกที่ตรงที่สุด

**6. Meal Log Module**
- สร้าง Meal Log: `food_item_id`, `quantity_g`, `logged_at`, `user_id`
- ดึง Meal Logs ตาม `user_id` และ `date`
- ลบ Meal Log

**7. Daily Summary Module (Deep Module)**
- Input: รายการ Meal Logs ของวันนั้น + Nutrition Goal
- Aggregate สารอาหารทั้งหมด
- คืน object เปรียบเทียบ actual vs goal ทุก Tracked Nutrient
- Pure function — ไม่ query database โดยตรง

**8. Dashboard API**
- Endpoint รวมที่คืน: Daily Summary วันนี้ + รายการ Meal Logs วันนี้ + Nutrition Goal
- เรียก Daily Summary Module หลัง fetch Meal Logs

### Database Schema (หลัก)

```
User          → Profile (1:1)
User          → NutritionGoal (1:many, มี 1 active)
User          → MealLog (1:many)
MealLog       → FoodItem (many:1)
FoodItem      → NutrientData (embedded หรือ 1:1)
```

---

## การตัดสินใจด้านการทดสอบ

### หลักการทดสอบที่ดี
- ทดสอบ **พฤติกรรมภายนอก** (output ที่ user/system เห็น) ไม่ใช่ implementation detail
- ไม่ mock database โดยไม่จำเป็น — ใช้ test database จริงสำหรับ integration tests
- Test names ต้องอธิบายสถานการณ์: `"คำนวณ TDEE ให้ชายอายุ 30 น้ำหนัก 70kg ระดับกิจกรรม SEDENTARY"`

### Modules ที่ต้องมี Unit Tests (เป็น Deep Modules ที่ test ได้อิสระ)

| Module | เหตุผล |
|--------|--------|
| TDEE Calculator | สูตรคณิตศาสตร์ที่ต้องแม่นยำ — test ทุก goal type และ activity level |
| Daily Summary | Aggregation logic — test กรณี Meal Logs หลายรายการ และกรณีไม่มีข้อมูล |
| USDA Food Search | Data mapping — test ว่า nutrient fields ถูก extract ถูกต้อง |

### Modules ที่ต้องมี Integration Tests

| Module | Coverage |
|--------|---------|
| Auth API | Registration, Login, Token validation |
| Meal Log API | Create, Read by date, Delete |
| Profile API | Create (onboarding), Update |
| Dashboard API | คืนข้อมูลครบและถูกต้อง |

---

## Out of Scope

- **Google OAuth** หรือ social login อื่นๆ
- **รูปภาพหลายรูปต่อมื้อ** — รองรับ 1 รูปต่อ 1 Meal Log
- **Custom food database** — ไม่รองรับให้ user เพิ่มอาหารที่ USDA ไม่มี
- **Meal planning** — ไม่มีฟีเจอร์วางแผนมื้ออาหารล่วงหน้า
- **Social features** — ไม่มีการ share หรือเปรียบเทียบกับผู้ใช้คนอื่น
- **Weekly/monthly reports** — scope เฉพาะ daily summary
- **Push notifications** — ไม่มีการแจ้งเตือนใน LINE
- **Barcode scanning** — ใช้รูปภาพอาหารเท่านั้น ไม่สนับสนุน barcode

---

## หมายเหตุเพิ่มเติม

- LIFF URL ต้องลงทะเบียนใน LINE Developers Console และต้องเป็น HTTPS (Vercel รองรับ)
- USDA FoodData Central API ใช้งานฟรีสำหรับ basic search แต่ต้องลงทะเบียน API key
- OpenRouter.ai API key ต้องเก็บเป็น environment variable บน Vercel — ห้าม hardcode ใน source code
- LINE LIFF SDK ต้องการ `liff.init()` ก่อนใช้งาน ควรทำใน root layout ของ Next.js
- การคำนวณ TDEE ใช้ Mifflin-St Jeor ซึ่งมีความแม่นยำสูงกว่า Harris-Benedict ในงานวิจัยปัจจุบัน ตามที่บันทึกใน ADR 0001
