# Learning System

ระบบเรียนใน MVP ใช้สถานะง่าย ๆ เพื่อช่วยให้ผู้เรียนรู้ว่าคำไหนยังใหม่ คำไหนกำลังฝึก และคำไหนจำได้แล้ว

## Statuses

## New

คำศัพท์ที่ผู้เรียนยังไม่เคยฝึก หรือยังไม่เคยตอบใน Quiz / Review

## Learning

คำศัพท์ที่ผู้เรียนเริ่มฝึกแล้ว แต่ยังตอบถูกไม่พอที่จะเข้าสู่รอบทบทวน

## Review

คำศัพท์ที่ผู้เรียนตอบถูกหลายครั้งแล้ว และควรถูกนำกลับมาทบทวนเป็นระยะ

## Mastered

คำศัพท์ที่ผู้เรียนตอบถูกมากพอในระบบ MVP และถือว่าจำได้ค่อนข้างดี

## Simple Rules

- คำใหม่เริ่มที่สถานะ `New`
- เมื่อเริ่มฝึกคำครั้งแรก ให้เปลี่ยนเป็น `Learning`
- ตอบถูก 2 ครั้ง ให้เลื่อนไป `Review`
- ตอบถูก 4 ครั้ง ให้เลื่อนไป `Mastered`
- ตอบผิด ให้กลับไป `Learning`
- คำที่อยู่ใน `Learning` และ `Review` ควรโผล่ใน Review Mode ก่อนคำที่อยู่ใน `Mastered`

## LocalStorage

ระบบจะเก็บความคืบหน้าด้วย LocalStorage เท่านั้น

ตัวอย่างข้อมูล:

```ts
type WordProgress = {
  wordId: string
  status: "New" | "Learning" | "Review" | "Mastered"
  correctCount: number
  wrongCount: number
  lastReviewedAt: string | null
}
```

ตัวอย่าง key:

```text
thai-english-vocab-progress
```

## Review Priority

ลำดับคำที่ควรนำมา Review:

1. คำที่ตอบผิดล่าสุด
2. คำสถานะ `Learning`
3. คำสถานะ `Review`
4. คำสถานะ `New`
5. คำสถานะ `Mastered`

## MVP Limitation

ระบบนี้เป็น spaced repetition แบบง่าย ยังไม่ใช้ algorithm ซับซ้อน เช่น SM-2

เป้าหมายของ MVP คือให้ผู้เรียนกลับมาฝึกคำที่ยังไม่แม่นได้จริง โดยไม่ทำระบบใหญ่เกินจำเป็น

