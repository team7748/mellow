# ระบบหมวดหมู่และไอคอนของคำศัพท์

เอกสารสรุประบบ category, icon, level, และชนิดคำ สำหรับโปรเจกต์ Thai-English Vocabulary MVP

---

## 1. หมวดหมู่ทั้งหมดที่ใช้

| Category | Thai | Icon |
|---|---|---|
| Daily Life | ชีวิตประจำวัน | Home |
| Bedroom | ห้องนอน | Bed |
| Bathroom | ห้องน้ำ | Bath |
| Kitchen | ห้องครัว | CookingPot |
| Food & Drinks | อาหารและเครื่องดื่ม | Utensils |
| Body & Health | ร่างกายและสุขภาพ | Heart |
| Clothes | เสื้อผ้า | Shirt |
| People & Family | คนและครอบครัว | Users |
| School & Work | โรงเรียนและงาน | Briefcase |
| Places | สถานที่ | MapPin |
| Travel | การเดินทาง | Bus |
| Shopping & Money | ซื้อของและเงิน | ShoppingBag |
| Feelings | ความรู้สึก | Smile |
| Objects | สิ่งของ | Package |
| Basic Actions | การกระทำพื้นฐาน | Zap |

> **หมายเหตุ:** คำศัพท์ 1 คำสามารถอยู่ได้หลายหมวด เพราะ `category` เป็น `array`

---

## 2. ชนิดคำทั้งหมดที่ใช้

| Part of Speech | ภาษาไทย | ตัวอย่าง |
|---|---|---|
| noun | คำนาม | bed, water, phone |
| verb | คำกริยา | eat, sleep, buy |
| adjective | คำคุณศัพท์ | happy, sad, tired |
| adverb | คำวิเศษณ์ | (สำรองไว้) |
| preposition | คำบุพบท | (สำรองไว้) |
| pronoun | สรรพนาม | (สำรองไว้) |
| conjunction | คำเชื่อม | (สำรองไว้) |
| phrase | วลี | make the bed, take a shower |

---

## 3. Level ใช้ยังไง

| Level | ความหมาย | ตัวอย่าง |
|---|---|---|
| 1 | คำพื้นฐานมาก ใช้บ่อยมาก | bed, eat, water |
| 2 | คำใช้บ่อย แต่ไม่พื้นฐานสุด | alarm, refrigerator, discount |
| 3 | คำเฉพาะบริบทมากขึ้น | career, explanation, professional |

Level ถูกกำหนดจาก CEFR: A1 → 1, A2 → 2, B1+ → 3

---

## 4. วิธีเพิ่มคำศัพท์ใหม่

เปิดไฟล์ `src/data/vocabularyExtra.ts` แล้วเพิ่ม object ใหม่ในอาเรย์ `vocabularyExtra`:

```ts
{
  id: "shower-001",
  sourceId: "EX_NEW",
  sourceScenario: "Daily Life Basics",
  scenario: "dailyLife",
  scenarioThai: "ชีวิตประจำวัน",
  word: "shower",
  cefr: "A1",
  partOfSpeech: "n./v.",
  ipa: "/ˈʃaʊ.ər/",
  thaiReading: "ชาว-เออร์",
  thaiPronunciation: "ชาว-เออร์",
  thaiMeaning: "ฝักบัว / อาบน้ำ",
  simpleMeaning: "a device for washing, or the act of washing",
  example: "I take a shower every morning.",
  exampleThai: "ฉันอาบน้ำทุกเช้า",
  contexts: {
    daily: { meaning: "ฝักบัว / อาบน้ำ", example: "I take a shower every morning.", thaiExample: "ฉันอาบน้ำทุกเช้า" },
    work: { meaning: "", example: "", thaiExample: "" },
    study: { meaning: "", example: "", thaiExample: "" },
  },
  synonyms: ["bath"],
  commonMistake: "",
  memoryTip: "shower = น้ำพุ่งลงมาเหมือนฝนตก",
  allocationStatus: "Category Expansion",
  memoryStatus: "New" as const,
  nextReviewDate: "today",
  reviewCount: 0,
  correctCount: 0,
  wrongCount: 0,
  category: ["Bathroom", "Daily Life"],
  subcategory: "Bathroom Items",
  level: 1,
  partOfSpeechStandard: "noun",
  icon: "ShowerHead",
  fallbackIcon: "CircleHelp",
  assetType: "library-icon",
  assetSource: "library",
  image: "",
}
```

---

## 5. วิธีเลือก icon ให้คำศัพท์

1. ดูว่าคำศัพท์เกี่ยวกับอะไร เช่น bed → Bed, wallet → Wallet
2. ค้นหาชื่อ icon ใน [Lucide Icons](https://lucide.dev/icons)
3. ตรวจว่า icon นั้นมีอยู่ใน `src/data/vocabIconMap.ts` หรือยัง
4. ถ้าไม่มี icon ที่เหมาะสม ให้ใช้ `CircleHelp` เป็น fallback
5. ตั้งค่า `assetType: "library-icon"` และ `assetSource: "library"` เมื่อใช้ lucide icon

---

## 6. วิธีเพิ่ม icon ใหม่ใน vocabIconMap

1. เปิดไฟล์ `src/data/vocabIconMap.ts`
2. เพิ่ม import:
   ```ts
   import { ..., NewIconName } from "lucide-react"
   ```
3. เพิ่มใน object `vocabIconMap`:
   ```ts
   NewIconName,
   ```

**ตัวอย่าง:** ถ้าต้องการเพิ่ม icon `Lamp`:
```ts
import { ..., Lamp } from "lucide-react"

export const vocabIconMap: Record<string, LucideIcon> = {
  ...,
  Lamp,
}
```

---

## 7. วิธีเพิ่ม category ใหม่

1. เพิ่มใน `VocabCategory` type ที่ `src/types/vocabulary.ts`:
   ```ts
   export type VocabCategory = ... | "NewCategory"
   ```

2. เพิ่มใน `categoryIconMap` ที่ `src/data/categoryIconMap.ts`:
   ```ts
   "NewCategory": "IconName",
   ```

3. เพิ่มใน `categoryThaiLabels`:
   ```ts
   "NewCategory": "ชื่อหมวดหมู่ภาษาไทย",
   ```

4. เพิ่มใน `allCategories` array

---

## 8. ตัวอย่าง vocabulary item ที่ถูกต้อง

```json
{
  "id": "bed-001",
  "word": "bed",
  "cefr": "A1",
  "partOfSpeech": "n.",
  "partOfSpeechStandard": "noun",
  "ipa": "/bɛd/",
  "thaiMeaning": "เตียง",
  "example": "I go to bed at 10.",
  "exampleThai": "ฉันเข้านอนตอน 4 ทุ่ม",
  "category": ["Bedroom", "Objects"],
  "subcategory": "Bedroom Items",
  "level": 1,
  "icon": "Bed",
  "fallbackIcon": "CircleHelp",
  "assetType": "library-icon",
  "assetSource": "library",
  "image": ""
}
```

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/types/vocabulary.ts` | Type definitions ทั้งหมด |
| `src/data/vocabulary.json` | คำศัพท์เดิม 60 คำ |
| `src/data/vocabularyExtra.ts` | คำศัพท์ใหม่ 50 คำ |
| `src/data/vocabularyEnhancements.ts` | Enhancement data สำหรับ 60 คำเดิม |
| `src/data/vocabIconMap.ts` | Mapping ชื่อ icon → lucide component |
| `src/data/categoryIconMap.ts` | Mapping หมวดหมู่ → icon + ชื่อไทย |
| `src/components/ui/VocabIcon.tsx` | Component กลางสำหรับแสดง icon |
| `src/utils/vocabulary.ts` | Functions สำหรับดึงและกรองข้อมูล |
