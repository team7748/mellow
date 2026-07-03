# Thai English Vocabulary MVP

เว็บแอปฝึกจำคำศัพท์ภาษาอังกฤษสำหรับผู้เริ่มต้นชาวไทย เรียนเป็นชุดเล็ก ๆ พร้อมคำแปลไทย IPA คำอ่านง่าย ตัวอย่างประโยค บริบทการใช้ Flashcard Quiz และระบบทบทวนแบบง่ายด้วย LocalStorage

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- LocalStorage
- JSON vocabulary data
- Markdown project documentation

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

เปิด URL ที่ Vite แสดงใน terminal เช่น `http://localhost:5173`

## Build

```bash
npm run build
```

## Folder Structure

```text
.
├── docs/
│   ├── PROJECT_BRIEF.md
│   ├── FEATURES.md
│   ├── DATA_SCHEMA.md
│   ├── LEARNING_SYSTEM.md
│   ├── UI_GUIDE.md
│   ├── STEP_LOG.md
│   └── DEPLOYMENT.md
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   ├── types/
│   └── utils/
├── public/
├── package.json
└── README.md
```

หมายเหตุ: โฟลเดอร์ `src/` และไฟล์ตั้งค่าแอปจะถูกสร้างใน Step ถัดไป

## How To Add New Vocabulary

เพิ่มคำศัพท์ใหม่ในไฟล์ JSON ของโปรเจกต์ โดยใช้โครงสร้างข้อมูลใน `docs/DATA_SCHEMA.md`

หลักการเพิ่มคำศัพท์:

- ใช้ `id` ที่ไม่ซ้ำ เช่น `a1-001`, `a1-002`
- กรอกคำแปลไทยและความหมายแบบง่าย
- ใส่ IPA และคำอ่านง่ายสำหรับผู้เรียนไทย
- ใส่ตัวอย่างครบ 3 บริบท: daily, work, study
- เพิ่ม `memoryTip` เพื่อช่วยจำ
- เพิ่ม `commonMistake` เพื่อเตือนจุดสับสน

## Deployment

อ่านรายละเอียดใน `docs/DEPLOYMENT.md`

สรุปสั้น ๆ:

```bash
npm run build
```

จากนั้นนำโฟลเดอร์ `dist/` ไป deploy บน Netlify หรือ Vercel

