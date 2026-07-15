# Supabase activation: Profile settings and reminders

> Mellow uses Light mode only. The legacy `user_preferences.theme` column remains in Supabase for schema compatibility, but the frontend does not read or write it. No migration is required for this compatibility column.

ฟีเจอร์โปรไฟล์เพิ่มตาราง `public.user_preferences` และ `public.push_subscriptions` และเพิ่มชนิดกิจกรรม `practice_time` ใน ledger เดิมผ่าน migration `006_profile_settings_and_reminders.sql` จึงต้อง apply migration ก่อนใช้งานกับข้อมูลจริง

## 1. ตรวจและ apply migration

จากโฟลเดอร์โปรเจกต์ที่เชื่อมกับ Supabase project แล้ว:

```bash
supabase migration list
supabase db push
```

ตรวจใน Dashboard ว่ามีตาราง `user_preferences`, `push_subscriptions`, RLS เปิดอยู่ และ policy จำกัดข้อมูลด้วย `auth.uid() = user_id`

## 2. สร้าง VAPID keys

สร้าง key pair ด้วยเครื่องมือ Web Push ที่เชื่อถือได้ เช่น:

```bash
npx web-push generate-vapid-keys
```

ใส่ public key ใน environment ฝั่ง Vite เท่านั้น:

```text
VITE_VAPID_PUBLIC_KEY=<public-key>
```

ห้ามนำ private key หรือ Supabase service-role key ใส่ตัวแปร `VITE_*`

## 3. ตั้ง secrets และ deploy Edge Function

สร้างค่า `REMINDER_CRON_SECRET` แบบสุ่มยาวอย่างน้อย 32 bytes แล้วรัน:

```bash
supabase secrets set WEB_PUSH_PUBLIC_KEY=<public-key> WEB_PUSH_PRIVATE_KEY=<private-key> WEB_PUSH_SUBJECT=mailto:admin@example.com REMINDER_CRON_SECRET=<random-secret>
supabase functions deploy send-learning-reminders --no-verify-jwt
```

Edge Function จะทำงานแบบ fail-closed เมื่อ secret ใดหายไป ห้ามใส่ fallback key หรือค่า secret จริงไว้ใน source code, migration, เอกสาร หรือไฟล์ที่ commit ลง Git

Function ตรวจ `Authorization: Bearer <REMINDER_CRON_SECRET>` เองก่อนอ่านฐานข้อมูล การใช้ `--no-verify-jwt` จำเป็นสำหรับ Cron ที่ไม่ได้ใช้ user JWT

## 4. ตั้ง Cron ทุก 1 นาที

ใน Supabase Dashboard สร้าง Cron/HTTP job ให้เรียก:

```text
POST https://<project-ref>.supabase.co/functions/v1/send-learning-reminders
Authorization: Bearer <REMINDER_CRON_SECRET>
```

ตั้ง schedule เป็น `* * * * *` Function จะส่งเฉพาะเมื่อเวลาท้องถิ่นตรงกับ `reminder_time` และไม่เคยส่งในวันท้องถิ่นนั้นแล้ว

## 5. Smoke test และตรวจ RLS

1. เข้าสู่ระบบด้วยบัญชีทดสอบ เปิดการแจ้งเตือน และอนุญาต Notification ในเบราว์เซอร์
2. ยืนยันว่ามีหนึ่งแถวใน `user_preferences` และอย่างน้อยหนึ่งแถวใน `push_subscriptions` ของ user นั้น
3. ตั้งเวลาเตือนเป็นนาทีถัดไป แล้วตรวจผล Function logs และ notification
4. ทดสอบด้วย user JWT ว่าอ่าน/แก้ไขแถวของตัวเองได้ แต่ query `user_id` ของผู้ใช้อื่นคืนศูนย์แถวหรือถูกปฏิเสธ
5. ยืนยันว่าการปิดแจ้งเตือนลบ subscription และตั้ง `reminder_enabled = false`

## Rollback

ปิด Cron job ก่อนเสมอ จากนั้นปิด reminder ของผู้ใช้ทั้งหมดและลบ subscription ก่อนย้อน schema:

```sql
update public.user_preferences set reminder_enabled = false;
delete from public.push_subscriptions;
```

หลังสำรองข้อมูลแล้วจึงค่อยสร้าง migration ใหม่สำหรับ rollback ห้ามแก้ migration `006` ที่ถูก apply ไปแล้ว
