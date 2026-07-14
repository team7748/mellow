# รายงานคำศัพท์ที่ยังไม่มี icon เหมาะสม

**(อัปเดตล่าสุด: ไอคอนทั้งหมดได้รับการจับคู่และแสดงผลเรียบร้อยแล้ว ✅)**

ก่อนหน้านี้มีคำศัพท์บางคำใช้ `CircleHelp` เป็น icon เนื่องจากหา icon ที่ตรงตัวไม่ได้ ในการอัปเดตล่าสุด เราได้ดึง icon จากคลัง `lucide-react` มาแสดงผลให้ครอบคลุมทุกคำแล้ว ดังนี้:

## คำจากชุดเดิม (vocabulary.json)

| word | meaning | category | currentIcon |
|---|---|---|---|
| available | ว่าง/พร้อม | School & Work | `Clock` |
| schedule | กำหนดการ | School & Work, Daily Life | `Calendar` |
| question | คำถาม | School & Work | `MessageCircleQuestion` |
| answer | คำตอบ | School & Work | `MessageSquare` |
| request | คำขอ | School & Work | `HandHelping` |
| respond | ตอบกลับ | School & Work, Basic Actions | `Reply` |
| reply | ตอบกลับ | School & Work, Basic Actions | `Reply` |
| correct | ถูกต้อง | School & Work | `CheckCircle` |
| mistake | ความผิดพลาด | School & Work | `TriangleAlert` |
| send | ส่ง | Basic Actions, School & Work | `Send` |
| video | วิดีโอ | Objects | `Video` |
| comment | ความคิดเห็น | School & Work, Shopping & Money | `MessageSquare` |
| share | แชร์ | Basic Actions, Shopping & Money | `Share2` |
| recommend | แนะนำ | Shopping & Money, Basic Actions | `ThumbsUp` |

## คำจากชุดใหม่ (vocabularyExtra)

| word | meaning | category | currentIcon |
|---|---|---|---|
| wake up | ตื่นนอน | Daily Life, Bedroom | `AlarmClock` |
| sit | นั่ง | Daily Life, Basic Actions | `Armchair` |
| closet | ตู้เสื้อผ้า | Bedroom, Objects | `DoorOpen` |
| toothbrush | แปรงสีฟัน | Bathroom | `Brush` |
| toilet | ห้องส้วม | Bathroom | `Toilet` |
| stove | เตา | Kitchen | `Flame` |
| refrigerator | ตู้เย็น | Kitchen | `Refrigerator` |
| plate | จาน | Kitchen | `Disc` |
| rice | ข้าว | Food & Drinks | `Wheat` |
| egg | ไข่ | Food & Drinks | `Egg` |
| bread | ขนมปัง | Food & Drinks | `Croissant` |
| chicken | ไก่ | Food & Drinks | `Drumstick` |
| pen | ปากกา | Objects | `Pen` |
| come | มา | Basic Actions | `Hand` |
| close | ปิด | Basic Actions | `X` |
| give | ให้ | Basic Actions | `HandHelping` |
| take | เอา/หยิบ | Basic Actions | `Hand` |

## สรุป
- ตอนนี้ทุกคำศัพท์ (รวมทั้ง 110 คำ) มี icon ประกอบที่สื่อความหมายทั้งหมดแล้ว
- `CircleHelp` จะถูกใช้เป็น fallback สำหรับระบบเผื่อกรณีหา icon ไม่เจอในอนาคตเท่านั้น
