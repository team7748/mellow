# Deployment

## Build

ติดตั้ง dependencies:

```bash
npm install
```

สร้าง production build:

```bash
npm run build
```

ตรวจ preview ก่อน deploy:

```bash
npm run preview
```

## Deploy To Netlify

วิธีผ่าน Netlify dashboard:

1. Push โปรเจกต์ขึ้น GitHub
2. เปิด Netlify แล้วเลือก Add new site
3. เลือก repository ของโปรเจกต์
4. ตั้งค่า build command เป็น `npm run build`
5. ตั้งค่า publish directory เป็น `dist`
6. กด Deploy

## Deploy To Vercel

วิธีผ่าน Vercel dashboard:

1. Push โปรเจกต์ขึ้น GitHub
2. เปิด Vercel แล้วเลือก Add New Project
3. เลือก repository ของโปรเจกต์
4. Framework preset ควรตรวจพบเป็น Vite
5. ตั้งค่า build command เป็น `npm run build`
6. ตั้งค่า output directory เป็น `dist`
7. กด Deploy

## Speak Mode AI checker

Deploy this project on Vercel so the `api/speak-answer-check.ts` Serverless Function is available. In Vercel Project Settings → Environment Variables, add `GEMINI_API_KEY` and optionally `GEMINI_MODEL=gemini-2.5-flash-lite` for Production, Preview, and Development. Never create a `VITE_GEMINI_API_KEY` variable.

For local endpoint testing, run `npx vercel dev`. Use `npm run dev` for frontend-only work; its Speak Mode checker needs a mocked endpoint unless the app is served by Vercel.

## Pre-Deploy Checklist

- รัน `npm run build` ผ่าน
- ตรวจหน้าเว็บด้วย `npm run preview`
- ตรวจว่า LocalStorage ทำงาน
- ตรวจว่า refresh หน้าแล้ว progress ยังอยู่
- ตรวจ responsive บนมือถือ
- ตรวจคำศัพท์ตัวอย่างอย่างน้อย 60 คำ
- ตรวจว่าไม่มี backend หรือ database dependency
- ตรวจว่าไม่มีข้อมูลลับใน source code

## Notes

โปรเจกต์นี้เป็น static frontend app จึงเหมาะกับ Netlify และ Vercel โดยไม่ต้องตั้งค่า server เพิ่ม
