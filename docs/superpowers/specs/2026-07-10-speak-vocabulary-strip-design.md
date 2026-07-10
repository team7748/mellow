# Speak Mode Horizontal Vocabulary Strip Design

## Goal

ปรับส่วนคำศัพท์ใน Speak Mode ให้เป็นแถบคำศัพท์แนวนอนแบบ Editorial ที่โปร่ง อ่านง่าย และสแกนคำได้เร็ว โดยไม่ใช้ Card, กล่องพื้นหลัง, Chip, Badge ขนาดใหญ่, เงา, มุมโค้ง หรือ horizontal scroll เป็นค่าเริ่มต้น

## Scope

เปลี่ยนเฉพาะการแสดงผลและ interaction ของ `VocabularyPanel` ใน Speak Mode โดยคง schema และข้อมูลจาก `ConversationVocab` เดิมไว้ ปัจจุบันข้อมูลที่มีคือ `word` และ `thaiMeaning` เท่านั้น รายละเอียดที่ไม่มี เช่น IPA, ชนิดคำ, ประโยคตัวอย่าง และคำแนะนำการใช้ จะไม่ถูกสร้างขึ้นหรือแสดงเป็น placeholder

ระบบอื่นที่ต้องคงเดิม: การเล่นเสียง, speech speed, answer input, grammar/meaning check, retry, conversation switching, progress persistence, Guest/Auth Mode, responsive layout และ Dark Mode หากมีอยู่ในระบบเดิม

## Design

### Structure

- Section heading ใช้ข้อความ `คำที่ช่วยตอบ` พร้อมคำกำกับสั้น ๆ `กดที่คำเพื่อเพิ่มลงในคำตอบ`
- คำศัพท์จัดเป็น CSS Grid แบบ responsive
- แต่ละ item เป็น semantic button ที่ไม่มีพื้นหลัง ไม่มีกรอบรอบ item และไม่มีเงา
- ใช้ `border-inline-start: 1px` สี neutral อ่อนเพื่อแบ่ง item หลัง item แรก
- คำศัพท์ภาษาอังกฤษใช้สี accent เดิม (`text-leaf`) และเป็นข้อความหลัก
- คำแปลไทยใช้สีรองเดิม (`text-slate-600`)
- ปุ่มเสียงเป็น icon button ขนาดเล็ก ใช้ `SpeakButton` เดิมและไม่ทำให้ layout เปลี่ยน
- ข้อมูลเสริมจะแสดงเฉพาะเมื่อมี field จริงใน data model; สำหรับข้อมูลปัจจุบันจะไม่แสดงแถวว่าง

### Responsive grid

- Desktop: `repeat(4, minmax(0, 1fr))` และขยายเป็น 5–6 คอลัมน์ได้เมื่อพื้นที่เพียงพอ
- Tablet: 3–4 คอลัมน์
- Mobile: 2 คอลัมน์
- จอเล็กมาก: 1 คอลัมน์
- คำยาวใช้ `break-words`/`min-w-0` เพื่อไม่ให้เกิด overflow
- เมื่อขึ้นแถวใหม่ เส้นแบ่งจะยังทำหน้าที่แยกคอลัมน์โดยไม่สร้างเส้นขอบรอบ item

### Interaction

- กดคำศัพท์: แทรกคำ ณ ตำแหน่ง cursor ของ answer textarea; ถ้าไม่มี selection ให้ต่อจากตำแหน่งปัจจุบันหรือท้ายข้อความตาม browser selection state
- ไม่ลบข้อความเดิม และเติมช่องว่างอย่างเหมาะสมโดยไม่เกิดช่องว่างซ้ำเกินจำเป็น
- แสดง feedback ขนาดเล็ก `เพิ่มคำแล้ว` ใต้หัวข้อ/แถบคำศัพท์ชั่วคราว โดยไม่ดัน layout หลักเกินพื้นที่ที่กันไว้
- กดไอคอนเสียง: เล่นเสียงคำศัพท์ผ่านระบบเดิม; event propagation ต้องไม่ทำให้กดเสียงแล้วแทรกคำซ้ำ
- ใช้ `aria-label`, keyboard focus และ focus-visible state ที่อ่านได้ชัด
- หากมีคำถูกใช้ใน answer แล้ว ให้แสดง `✓` ขนาดเล็กข้างคำศัพท์หรือเปลี่ยนสีเล็กน้อย โดยไม่ใช้ badge หรือพื้นหลังเต็ม

## Component boundaries and data flow

`InteractivePracticePlayer` ยังคงเป็นเจ้าของ answer state และ speech speed เพราะเป็นเจ้าของ textarea อยู่แล้ว ส่วน `VocabularyPanel` รับรายการคำศัพท์และ callback สำหรับการแทรกคำ/แจ้ง feedback ผ่าน props เพื่อให้ component แสดงผลได้โดยไม่ผูกกับวิธีเก็บ state ภายใน practice

Flow:

```text
InteractivePracticePlayer answer + cursor
        ↓ props
VocabularyPanel → onInsertWord(word)
        ↓
answer textarea updated + feedback state
```

หาก VocabularyPanel ถูกใช้ใน conversation view ที่ไม่มี answer textarea จะคง fallback เป็นการแสดงผลและเสียงเท่านั้น โดยไม่พยายามสร้างช่องตอบใหม่

## Accessibility and motion

- ทุกคำศัพท์กดได้ด้วย keyboard และมี accessible name ที่รวมคำอังกฤษกับคำแปล
- ปุ่มเสียงแยกจากปุ่มคำศัพท์และมี accessible label เฉพาะ
- feedback ใช้ `role="status"` และไม่พึ่งสีเพียงอย่างเดียว
- animation ใช้เฉพาะ opacity/สีแบบเบา ๆ และปิด/ลดลงเมื่อ `prefers-reduced-motion: reduce`
- contrast ต้องสอดคล้องกับสี text และ accent เดิมของระบบ

## Verification

เพิ่ม/ปรับ test ให้ครอบคลุม:

1. แสดงคำศัพท์และคำแปลที่มีอยู่
2. ไม่แสดง field รายละเอียดที่ไม่มีข้อมูล
3. responsive class และไม่มี card/chip/shadow/background บน vocabulary item
4. กดคำแล้วแทรกคำโดยรักษาข้อความเดิม
5. แทรก ณ cursor และจัดช่องว่างอัตโนมัติ
6. กดเสียงไม่ทำให้แทรกคำซ้ำ
7. แสดง feedback และสถานะ ✓ เมื่อคำถูกใช้
8. รายการว่างยังคงไม่ render panel
9. รัน TypeScript/build และชุด test ที่เกี่ยวข้อง

## Non-goals

- ไม่เปลี่ยน CSV หรือ `ConversationVocab` schema
- ไม่เติมข้อมูล IPA/ชนิดคำ/ตัวอย่างจาก dataset อื่น
- ไม่ปรับ layout ของ conversation cards, tabs, answer evaluation หรือ progress system
- ไม่เพิ่ม modal หรือ horizontal carousel
