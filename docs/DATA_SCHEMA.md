# Data Schema

ข้อมูลคำศัพท์จะเก็บเป็น JSON เพื่อให้อ่านง่าย แก้ไขง่าย และขยายจำนวนคำได้ในอนาคต

## VocabularyItem

```ts
type VocabularyItem = {
  id: string
  word: string
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  partOfSpeech: string
  ipa: string
  thaiReading: string
  thaiMeaning: string
  simpleMeaning: string
  contexts: {
    daily: {
      meaning: string
      example: string
      thaiExample: string
    }
    work: {
      meaning: string
      example: string
      thaiExample: string
    }
    study: {
      meaning: string
      example: string
      thaiExample: string
    }
  }
  synonyms: string[]
  commonMistake: string
  memoryTip: string
}
```

## Field Notes

`id` ต้องไม่ซ้ำ และควรตั้งให้อ่านง่าย เช่น `a1-001`

`word` คือคำศัพท์ภาษาอังกฤษ เช่น `book`

`cefr` ใช้บอกระดับความยากตาม CEFR

`partOfSpeech` คือชนิดของคำ เช่น `noun`, `verb`, `adjective`

`ipa` คือสัทอักษร เช่น `/bʊk/`

`thaiReading` คือคำอ่านง่ายสำหรับผู้เรียนไทย เช่น `บุค`

`thaiMeaning` คือคำแปลไทยแบบสั้น

`simpleMeaning` คือความหมายภาษาอังกฤษแบบง่าย เหมาะกับผู้เริ่มต้น

`contexts` แยกบริบทการใช้เป็น daily, work และ study เพื่อให้เห็นว่าคำเดียวกันใช้ได้หลายสถานการณ์

`synonyms` ใช้เก็บคำใกล้เคียง เพื่อช่วยขยายคลังคำศัพท์

`commonMistake` ใช้เตือนข้อผิดพลาดที่ผู้เรียนไทยอาจเจอ

`memoryTip` ใช้ช่วยจำแบบสั้น ๆ

## Example

```json
{
  "id": "a1-001",
  "word": "book",
  "cefr": "A1",
  "partOfSpeech": "noun",
  "ipa": "/bʊk/",
  "thaiReading": "บุค",
  "thaiMeaning": "หนังสือ",
  "simpleMeaning": "a set of printed or digital pages",
  "contexts": {
    "daily": {
      "meaning": "ใช้พูดถึงหนังสือทั่วไปในชีวิตประจำวัน",
      "example": "I read a book every night.",
      "thaiExample": "ฉันอ่านหนังสือทุกคืน"
    },
    "work": {
      "meaning": "ใช้พูดถึงหนังสือหรือเอกสารที่เกี่ยวกับงาน",
      "example": "This book helps me understand marketing.",
      "thaiExample": "หนังสือเล่มนี้ช่วยให้ฉันเข้าใจการตลาด"
    },
    "study": {
      "meaning": "ใช้พูดถึงหนังสือเรียนหรือหนังสือที่ใช้ศึกษา",
      "example": "Please open your book to page ten.",
      "thaiExample": "กรุณาเปิดหนังสือไปที่หน้า 10"
    }
  },
  "synonyms": ["textbook", "guide"],
  "commonMistake": "อย่าสับสน book ที่เป็นคำนาม กับ book ที่เป็นกริยาแปลว่าจอง",
  "memoryTip": "นึกถึง book = หนังสือที่เปิดอ่านได้"
}
```

## Scaling To 1,000 Words

เพื่อให้ขยายข้อมูลได้ง่าย:

- แยกไฟล์ตามระดับ เช่น `a1.json`, `a2.json`
- ใช้ `id` แบบมี prefix ระดับ เช่น `a1-001`
- คง schema เดิมทุกคำ
- ตรวจข้อมูลด้วย TypeScript type
- หลีกเลี่ยงการผูกข้อมูลกับ UI โดยตรง

