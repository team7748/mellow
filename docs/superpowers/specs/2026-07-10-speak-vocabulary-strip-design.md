# Speak Mode Lesson Vocabulary Rows Design

## Goal

ปรับส่วนคำศัพท์ใน Speak Mode ให้กลับมาเป็น “คำศัพท์ในบท” ที่ใช้ประกอบการเรียน โดยแสดงเป็นรายการแถวภายในกล่องหลักหนึ่งกล่อง อ่านง่ายบน sidebar และ mobile และไม่เชื่อมกับช่องพิมพ์คำตอบ

## Scope

เปลี่ยนเฉพาะ `VocabularyPanel` และถอดการเชื่อมคำศัพท์กับ `InteractivePracticePlayer` ที่เพิ่มไว้ก่อนหน้า ข้อมูลยังใช้ `ConversationVocab.word` และ `ConversationVocab.thaiMeaning` เท่านั้น ไม่สร้าง IPA, ชนิดคำ, ตัวอย่าง หรือข้อมูลเสริมที่ไม่มีใน CSV

ระบบที่ต้องคงเดิม: การเล่นเสียง, speech settings, ช่องพิมพ์คำตอบ, grammar/meaning evaluation, retry, conversation switching, progress persistence, Guest/Auth Mode และ responsive behavior

## Chosen Design: Lesson Vocabulary Rows

- ใช้กล่องหลักหนึ่งกล่องตาม `surface-card` เดิม
- Header แสดงไอคอนหนังสือขนาดเล็กและหัวข้อ `คำศัพท์ในบท`
- คำศัพท์เรียงแนวตั้งเป็นแถว ไม่ใช้ grid ของกล่องย่อย
- แต่ละแถวมีคำศัพท์ภาษาอังกฤษเป็นข้อความหลัก คำแปลไทยเป็นข้อความรอง และปุ่มเสียงขนาดเล็กชิดขวา
- ใช้เส้นแนวนอนบาง ๆ คั่นระหว่างแถว
- แต่ละแถวไม่มีพื้นหลังแยก ไม่มีเงา และไม่มีสถานะ selected/used
- ปุ่มเสียงใช้ `SpeakButton` และ speech settings เดิม
- คำยาวใช้ `min-w-0` และ `break-words` เพื่อไม่ให้ overflow

## Placement

- Desktop: แสดงใน sidebar ใต้รายการบทสนทนาเหมือนตำแหน่งเดิม
- Mobile/Tablet: แสดงหลังส่วน player/practice เหมือน flow เดิม
- แสดงทั้ง conversation และ practice view โดยไม่ย้ายเข้า answer card

## Removed Behavior

- ไม่มี `onInsertWord`
- ไม่มีการแทรกคำ ณ cursor
- ไม่มีข้อความ `เพิ่มคำแล้ว`
- ไม่มีสถานะเครื่องหมาย `✓`
- ไม่มีการตรวจว่าคำถูกใช้ในคำตอบหรือไม่
- ไม่มีข้อความกำกับ `กดที่คำเพื่อเพิ่มลงในคำตอบ`

## Accessibility

- รายการใช้ semantic `section`, heading, `ul` และ `li`
- ปุ่มเสียงมี accessible label `ฟังเสียง <word>`
- แถวคำศัพท์ไม่ถูกทำให้ดูหรือทำงานเหมือนปุ่ม
- focus behavior ของปุ่มเสียงใช้มาตรฐานเดิม

## Verification

1. แสดงหัวข้อ `คำศัพท์ในบท`
2. แสดงคำอังกฤษและคำแปลไทยที่มีอยู่
3. แสดงแต่ละคำเป็นแถวพร้อมเส้นคั่น
4. ปุ่มเสียงยังทำงานผ่าน `SpeakButton`
5. ไม่พบปุ่มเพิ่มคำ, feedback, used state หรือ callback เชื่อม answer
6. vocabulary panel กลับไปอยู่ตำแหน่งเดิมทั้ง desktop และ mobile
7. answer input และ evaluation tests เดิมยังผ่าน
8. production build ผ่านโดยไม่มี TypeScript error

## Non-goals

- ไม่เปลี่ยน CSV หรือ `ConversationVocab` schema
- ไม่เพิ่มรายละเอียดคำศัพท์จาก dataset อื่น
- ไม่เปลี่ยนรูปแบบ question, answer, feedback หรือ navigation ส่วนอื่น
