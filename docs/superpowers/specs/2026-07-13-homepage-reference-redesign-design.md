# Home Page Reference Redesign

## Goal

ปรับเฉพาะ UI และ responsive layout ของหน้า Home ให้ใกล้เคียงภาพอ้างอิง โดยรักษา business logic, state, LocalStorage, Supabase, API, routing, ระบบตรวจคำตอบ และ action ของปุ่มเดิมทั้งหมด

## Design Direction

- ใช้โทนขาว ครีม และเขียวธรรมชาติตาม token ใน `DESIGN.md`
- ใช้พื้นผิวสะอาด การ์ดมุมโค้ง 12–16px เส้นขอบเทาอมเขียวอ่อน และเงาบาง
- ใช้ภาพที่ผู้ใช้แนบและภาพเดิมในโปรเจกต์ โดยแสดงด้วย `object-fit: contain` และไม่ครอบตัด
- ใช้ตัวอักษรและระยะห่างเพื่อสร้างลำดับชั้นที่ชัดเจน โดยไม่เพิ่มข้อความหรือข้อมูลเพื่อเติมพื้นที่
- คง Sidebar และ Mobile Bottom Navigation เดิม รวมถึงรายการเมนูและเส้นทางทั้งหมด

## Data Integrity Rules

- ทุกตัวเลข สถานะ คำศัพท์ และ progress ต้องมาจากข้อมูลหรือ utility ที่ระบบเดิมมีอยู่จริง
- ห้ามแสดงค่า hard-code เดิม เช่น `8 / 20 words`, mission progress ตัวอย่าง, daily goal ตัวอย่าง หรือ Quick review ตัวอย่าง หากไม่สามารถผูกกับข้อมูลจริงได้
- ส่วนที่ไม่มีข้อมูลจริงให้ซ่อนทั้งส่วนหรือซ่อนรายละเอียดที่ไม่มีข้อมูล โดยไม่สร้างระบบใหม่
- ปุ่มเดิมที่มี action หรือ route จริงต้องคง action และ route เดิมไว้ หากส่วนที่รองรับปุ่มนั้นยังแสดงอยู่

## Desktop Layout

1. ใช้ Sidebar เดิมด้านซ้าย
2. Hero Card อยู่ด้านบนของพื้นที่เนื้อหา
   - คำทักทายและชื่อผู้ใช้จริงอยู่ซ้าย
   - ข้อความเดิมที่มีอยู่แล้วอยู่ใต้คำทักทาย
   - ภาพสลอธและอุปกรณ์การเรียนอยู่ขวาโดยไม่ทับข้อความ
3. Stats อยู่ใต้ Hero เป็นแถวเดียว
   - แสดงเฉพาะ Day streak, Daily goal และ Words learned ที่มีข้อมูลจริง
   - หาก metric ใดไม่มีแหล่งข้อมูลจริง ให้ไม่ render metric นั้น
4. เนื้อหาด้านล่างใช้สองคอลัมน์
   - ซ้ายกว้างกว่า: Continue learning แล้ว Explore
   - ขวา: Today’s missions แล้ว Quick review
5. Continue learning ใช้ข้อความและ progress จริงทางซ้าย ภาพกระเป๋าและอุปกรณ์ทางขวา และใช้ action เดิม
6. Explore ใช้หมวดหมู่เดิมและ route เดิม เป็นการ์ดไอคอนขนาดเล็กแนวนอน
7. Today’s missions แสดงเฉพาะรายการที่มีข้อมูลและ progress จริงจากระบบเดิม
8. Quick review แสดงเฉพาะเมื่อมีคำศัพท์จริงที่ระบบสามารถเลือกจากสถานะเดิมได้ พร้อมเสียงและสถานะเดิม

## Mobile Layout

- ซ่อน Sidebar ตาม behavior เดิมและใช้ Bottom Navigation เดิม
- เรียงส่วนตามลำดับ Hero → Stats → Continue learning → Today’s missions → Explore → Quick review
- Hero จัดข้อความและภาพแยกพื้นที่กัน ไม่เกิด overlap
- Stats อยู่แถวเดียวเมื่อมีครบสามรายการ โดยลด typography และ spacing ตามพื้นที่; หากมีน้อยกว่าสามรายการให้กระจายพื้นที่เท่ากัน
- Explore เลื่อนแนวนอนได้ภายใน section โดยไม่ทำให้หน้าเกิด horizontal overflow
- ทุกส่วนอื่นเรียงคอลัมน์เดียว
- รองรับ viewport ตั้งแต่ 320px ขึ้นไป ไม่มีข้อความทับภาพ ไม่มีการ์ดล้น และไม่มี horizontal page overflow

## Interaction and Accessibility

- ไม่เพิ่มปุ่มหรือ affordance ใหม่
- ปุ่มเดิมต้องยัง keyboard-focusable และมี focus state ที่มองเห็นได้
- รูปประกอบใช้ alt text ที่เหมาะสม หรือ alt ว่างเมื่อเป็นภาพตกแต่ง
- touch target ที่กดได้ต้องมีขนาดเหมาะกับมือถือ
- progress ต้องมีข้อความกำกับและไม่สื่อความหมายด้วยสีเพียงอย่างเดียว
- motion จำกัดเฉพาะ hover/press state เดิมและรองรับ `prefers-reduced-motion`

## Implementation Scope

- แก้เฉพาะไฟล์ที่จำเป็นต่อหน้า Home และ asset ที่ผู้ใช้ส่งมา
- คาดว่าจะปรับ `src/pages/HomePage.tsx` และอาจเพิ่ม CSS เฉพาะหน้าใน `src/styles.css`
- หลีกเลี่ยงการเปลี่ยน `AppLayout`, `Sidebar`, `MobileNav` และระบบข้อมูล เว้นแต่ต้องแก้ class สำหรับป้องกัน overflow โดยไม่เปลี่ยน behavior
- ไม่เพิ่ม dependency หรือ component system ใหม่

## Verification

- เพิ่มหรือปรับ Home tests ให้ตรวจว่า route/action เดิมยังทำงาน
- ตรวจว่าไม่มีข้อมูลตัวอย่างที่ไม่มีแหล่งข้อมูลจริงแสดงอยู่
- รัน unit tests, TypeScript/build และ lint ที่โปรเจกต์รองรับ
- ตรวจภาพจริงบน Desktop และ viewport 320px, 375px, 768px และขนาด Desktop อย่างน้อยหนึ่งขนาด
- ตรวจ page scroll width เทียบกับ viewport width เพื่อยืนยันว่าไม่มี horizontal overflow

## Acceptance Criteria

- หน้า Home ใกล้เคียงโครงสร้างและบรรยากาศของภาพอ้างอิง
- ใช้เฉพาะภาพที่แนบหรือ asset เดิม และรูปไม่ถูกตัด
- ข้อมูลที่แสดงทั้งหมดตรวจสอบย้อนกลับไปยัง state หรือ utility เดิมได้
- ไม่มีฟังก์ชัน ระบบ ปุ่ม เส้นทาง หรือข้อมูลตัวอย่างใหม่
- Sidebar และ Mobile Bottom Navigation เดิมยังทำงาน
- ไม่มี overlap หรือ horizontal overflow ตั้งแต่ 320px ขึ้นไป
- tests และ build ที่เกี่ยวข้องผ่าน
