# Speak Mode (Conversation Mode) Specification

## ภาพรวม (Overview)
ฟีเจอร์ **Speak Mode** เป็นโหมดการเรียนรู้แบบใหม่สำหรับฝึกทักษะการสนทนาภาษาอังกฤษตามสถานการณ์ (Situation-based conversation practice)

## ข้อควรระวังด้านโครงสร้างข้อมูล (Data Separation Rules)
- **ห้ามรวมข้อมูล**: ฟีเจอร์นี้ใช้ข้อมูลจากไฟล์ CSV ชุดใหม่ทั้งหมด ห้ามนำข้อมูลบทสนทนาไปรวมกับไฟล์ข้อมูลคำศัพท์ (Vocabulary) เดิมเด็ดขาด
- **ห้ามแก้ Schema เดิม**: Schema ของระบบคำศัพท์เดิมต้องไม่มีการเปลี่ยนแปลง เพื่อป้องกันผลกระทบต่อระบบ Flashcard และ Practice
- **แยกขอบเขต**: ข้อมูลชุดนี้ใช้สำหรับหน้าจอ Speak Mode / Conversation Mode เท่านั้น

## ไฟล์ข้อมูลที่ใช้ (Data Sources)
ต้องโหลดจาก CSV (จัดเก็บใน `public/data/conversations/`):
1. `english_conversation_categories.csv` (รายชื่อหมวดหมู่)
2. `english_conversation_lines.csv` (ประโยคสนทนาเรียงตามลำดับ)
3. `english_conversation_vocab.csv` (คำศัพท์เฉพาะในหมวดหมู่)
4. `english_conversation_practice.csv` (คำถามสำหรับฝึกตอบ)

## โครงสร้าง Type / Schema
```ts
export type ConversationCategory = {
  id: string
  title: string
  thaiTitle: string
  conversationCount: number
  lineCount: number
  vocabCount: number
  practiceCount: number
}

export type ConversationLine = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  conversationId: string
  conversationNo: number
  conversationTitle: string
  lineNo: number
  speaker: string
  english: string
  thai: string
}

export type ConversationVocab = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  vocabNo: number
  word: string
  thaiMeaning: string
}

export type ConversationPractice = {
  categoryId: string
  categoryTitle: string
  categoryThai: string
  questionNo: number
  questionEnglish: string
  questionThai: string
  answerExample?: string
}
```

## ระบบบันทึกความคืบหน้า (Progress Tracking)
- ใช้ `LocalStorage` เท่านั้น (No Backend)
- ใช้คีย์ `speakModeProgress` (ห้ามใช้คีย์เดียวกับระบบคำศัพท์เดิม)
- ข้อมูลที่เก็บ: หมวดล่าสุด, บทสนทนาล่าสุด, วันที่เข้าใช้งานล่าสุด, และสถิติการเรียนจบ

## ข้อตกลงการพัฒนา UI (UX/UI Guidelines)
- Mobile-first design, ปุ่มใหญ่สัมผัสง่าย
- แยกปุ่มซ่อน/แสดงคำแปลชัดเจน (เน้นประโยคภาษาอังกฤษให้เด่นกว่า)
- ไม่รก ไม่มี Animation ฟุ่มเฟือย
- มีแถบ Progress หรือ Text บ่งบอกความคืบหน้า (เช่น "ประโยคที่ 3 / 10")
