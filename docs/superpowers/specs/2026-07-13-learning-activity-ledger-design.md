# Learning Activity Ledger Design

## Goal

สร้างข้อมูลจริงสำหรับ Day streak, Daily goal และ Today’s missions โดยบันทึกกิจกรรมการเรียนที่สำเร็จจาก Flashcard, Quiz, Grammar และ Speak ลง Event ledger แบบ local-first แล้วคำนวณ Home summary จาก event เหล่านั้น

## Scope

- เพิ่มระบบ Learning activity ledger ใหม่
- รองรับ Guest ผ่าน LocalStorage
- รองรับผู้ใช้ที่ล็อกอินผ่าน LocalStorage และ Supabase background sync
- เชื่อม event กับ action สำเร็จใน Flashcard, Quiz, Grammar และ Speak
- แสดง Day streak, Daily goal และ Today’s missions บนหน้า Home จากข้อมูลจริง
- รักษา progress, routing, answer checking และ storage เดิมของแต่ละโหมด

## Non-Goals

- ไม่เพิ่มหน้าตั้งค่า Daily goal ในรอบนี้
- ไม่เพิ่มปุ่มหรือ route ใหม่
- ไม่เปลี่ยนเกณฑ์ตรวจคำตอบของแต่ละโหมด
- ไม่ใช้การเปิดหน้า การกดเมนู หรือการเปิดการ์ดเป็นกิจกรรมการเรียน
- ไม่ merge Guest ledger เข้า User โดยอัตโนมัติเมื่อ User มีข้อมูลอยู่แล้ว
- ไม่ทำ `003_quiz_history.sql`; หมายเลขนี้สงวนไว้สำหรับงาน Quiz History รอบถัดไป

## Event Model

```ts
type LearningActivityKind =
  | "vocabulary_answer"
  | "grammar_answer"
  | "conversation_completed"

type LearningActivityMode = "flashcard" | "quiz" | "grammar" | "speak"

type LearningActivityEvent = {
  id: string
  kind: LearningActivityKind
  mode: LearningActivityMode
  entityId: string
  occurredAt: string
  localDate: string
  timezoneOffsetMinutes: number
  metadata?: {
    correct?: boolean
    wasDue?: boolean
    sessionId?: string
  }
}

type LearningActivityLedger = {
  version: 1
  events: LearningActivityEvent[]
  updatedAt: string | null
}
```

### Event Identity

- ทุก answer attempt มี event ID ของตัวเอง
- Flashcard, Quiz และ Grammar ใช้ action/session identity เพื่อไม่ให้ React render หรือ retry สร้าง event ซ้ำ
- Speak completion ใช้ ID ที่ deterministic จาก User/Guest scope, conversation ID และ local date เพื่อไม่นับบทเดิมซ้ำในวันเดียวกัน
- Supabase ใช้ event ID แบบ text เป็น primary key เพื่อรองรับทั้ง UUID ของ answer attempt และ deterministic ID ของ Speak completion
- Merge และ summary deduplicate ด้วย event ID ก่อนคำนวณ

## Qualifying Activities

### Flashcard

บันทึก `vocabulary_answer` หลัง `WordProgress` ถูกบันทึกสำเร็จ โดยระบุ:

- `mode: "flashcard"`
- `entityId: wordId`
- `metadata.correct`
- `metadata.wasDue` จากสถานะก่อนอัปเดตคำ
- `metadata.sessionId`

### Quiz

บันทึก `vocabulary_answer` หลัง Quiz result ถูกบันทึกสำเร็จ โดยระบุ:

- `mode: "quiz"`
- `entityId: wordId` หรือ question identity ที่ผูกกลับคำศัพท์ได้
- `metadata.correct`
- `metadata.sessionId`

### Grammar

บันทึก `grammar_answer` หลัง grammar progress ถูกบันทึกสำเร็จ โดยระบุ:

- `mode: "grammar"`
- `entityId: questionId`
- `metadata.correct`
- `metadata.sessionId` เมื่อมี session

### Speak

บันทึก `conversation_completed` หลัง conversation ถูกเพิ่มลง `completedConversations` สำเร็จ โดยระบุ:

- `mode: "speak"`
- `entityId: conversationId`
- deterministic event ID ต่อ conversation และ local date

## Home Summary Rules

### Day Streak

- วันที่ active คือ local date ที่มี qualifying event อย่างน้อยหนึ่งรายการ
- ถ้าวันล่าสุดคือวันนี้ ให้นับย้อนหลังจากวันนี้
- ถ้าวันล่าสุดคือเมื่อวาน ให้นับย้อนหลังจากเมื่อวาน เพื่อไม่ให้ streak หายก่อนผู้ใช้เรียนในวันนี้
- ถ้าวันล่าสุดเก่ากว่าเมื่อวาน streak เป็น `0`
- ข้ามเดือนและข้ามปีต้องนับต่อเนื่องตาม local calendar

### Daily Goal

- เป้าคงที่เริ่มต้น `15` qualifying activities ต่อ local date
- นับ event จริงทุก mode หลัง deduplication
- การตอบคำหรือคำถามเดิมหลาย attempt นับได้ หากเป็น action จริงคนละ event
- progress แสดง `min(completed, 15) / 15`
- completion state เป็นจริงเมื่อ completed อย่างน้อย 15

### Today’s Missions

#### Review

- นับ unique vocabulary `entityId` ของ event วันนี้ที่ `mode === "flashcard"` และ `metadata.wasDue === true`
- เป้าคือ `min(5, dueReviewWordsNow + uniqueDueWordsReviewedToday)`
- สูตรนี้รักษาเป้าเดิมไม่ให้ลดลงหลังทบทวนสำเร็จ
- ถ้าเป้าเป็น `0` ให้ซ่อน Review mission

#### Flashcards

- นับ `vocabulary_answer` ของวันนี้ที่ `mode === "flashcard"`
- เป้า `10` answers
- progress แสดงไม่เกิน 10 แต่ ledger เก็บ action จริงทั้งหมด

#### Speak

- นับ unique `conversation_completed` ของวันนี้
- เป้า `1` conversation
- deterministic event ID ป้องกันการจบบทเดิมซ้ำจาก render หรือ sync

## Local Storage Architecture

สร้างโมดูลใน `src/lib/activity/`:

- `activityTypes.ts`
- `activityKeys.ts`
- `activityNormalizer.ts`
- `activityLocalStorage.ts`
- `activityMerge.ts`
- `activityCloudRepository.ts`
- `activitySyncManager.ts`
- `activitySummary.ts`
- `recordLearningActivity.ts`

Storage keys:

- Guest: `english-app:guest:learning-activity`
- User: `english-app:user:{userId}:learning-activity`
- Guest claim marker: `english-app:guest:learning-activity:claimed-by`

LocalStorage เป็น source ที่หน้า Home อ่านทันที การบันทึก event ต้องเขียน Local สำเร็จก่อน queue cloud sync

## Normalization and Merge

- Runtime normalizer รับเฉพาะ ledger version ที่รองรับ
- Event ที่ไม่มี ID, kind, mode, entity ID, ISO timestamp หรือ valid local date ถูกทิ้ง
- Metadata ที่ไม่ถูกต้องถูก normalize เป็น field ที่รองรับเท่านั้น
- Deduplicate event ด้วย ID
- Merge เป็น pure function ที่รวม Local และ Cloud by ID
- เมื่อ ID ตรงกัน ให้ event ที่ `occurredAt` ใหม่กว่าชนะ
- เมื่อ timestamp เท่ากัน ให้ Local ชนะ
- `updatedAt` ของ ledger เป็นเวลาล่าสุดจากทั้งสองฝั่ง

## Guest Claim Rules

ใช้กฎเดียวกับ Vocabulary progress:

- ไม่ merge Guest เข้า User โดยอัตโนมัติทั่วไป
- Claim ได้เมื่อ User ว่างทั้ง Local และ Cloud
- Guest ledger ต้องมีข้อมูลและยังไม่เคยถูก claim
- หลัง claim สำเร็จเขียน marker ระบุ User ID
- Sign out หรือเปลี่ยนบัญชีต้องไม่ claim ซ้ำ

## Supabase

### Migration

เพิ่ม `supabase/migrations/004_learning_activity_events.sql` เพื่อไม่ชน `003_quiz_history.sql`

### Table

`learning_activity_events`:

- `id text primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `kind text not null`
- `mode text not null`
- `entity_id text not null`
- `occurred_at timestamptz not null`
- `local_date date not null`
- `timezone_offset_minutes integer not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

เพิ่ม check constraints สำหรับ kind, mode และ timezone offset ที่สมเหตุสมผล และเพิ่ม index `(user_id, local_date)`

### RLS and Privileges

- เปิด RLS
- สร้าง policy แยก `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- ทุก policy ใช้ `auth.uid() = user_id`
- `INSERT` และ `UPDATE` มี `WITH CHECK`
- reset/revoke privilege ที่กว้างเกินจำเป็น แล้ว grant เฉพาะ authenticated role ตาม operation ที่รองรับ
- Migration ต้อง idempotent และปลอดภัยกับฐานข้อมูลเดิม

## Sync Manager

- Queue ใช้ Pull → Normalize → Merge → Push
- Cloud repository upsert ตาม event ID
- Local data ไม่ถูกลบเมื่อ Cloud ล้มเหลว
- Offline queue retry เมื่อ browser กลับมา online
- ใช้ generation token ยกเลิก timer และทิ้ง response เก่าเมื่อ sign out หรือเปลี่ยนบัญชี
- Request ของ User เดิมห้ามเขียนข้อมูลเข้า active User ใหม่

## Error Handling

- Local ledger เสีย: คืน empty ledger หรือ normalized valid events โดยไม่ทำให้ Home crash
- Cloud error: Home ใช้ Local ต่อและ sync ใหม่ภายหลัง
- Duplicate event: deduplicate by ID ก่อน summary และ merge
- Invalid/future-incompatible event: ข้าม record นั้นโดยไม่ทิ้ง ledger ทั้งชุด
- เปลี่ยน timezone: event เก่ายังคง local date เดิม; event ใหม่ใช้ timezone ปัจจุบัน
- ไม่มี event: streak `0`, daily goal `0/15`, Review mission ซ่อนหากไม่มี due words, Flashcards และ Speak แสดง `0/target`

## Home UI Integration

- Stats row แสดง Day streak, Daily goal และ Words learned จากข้อมูลจริง
- Daily goal progress ใช้ activity summary วันนี้
- Today’s missions แสดงรายการแนวตั้งพร้อม icon เดิม, ชื่อ,รายละเอียดจริง และ progress bar
- Review mission render แบบ conditional ตาม adaptive target
- Flashcards และ Speak render เสมอด้วย progress จริง
- ไม่เพิ่มปุ่มใหม่; mission items ใช้ route/action เดิมที่มีอยู่
- Mobile stats คงหนึ่งแถวและลด spacing/type ที่ 320px
- Mobile order: Hero → Stats → Continue learning → Today’s missions → Explore → Quick review

## Testing

### Unit

- event normalization และ invalid record filtering
- merge, timestamp conflict และ Local tie-break
- event ID deduplication
- local date และ timezone offset
- streak วันนี้, เมื่อวาน, gap, ข้ามเดือนและข้ามปี
- daily goal รวมทุก mode และไม่นับ duplicate ID
- Review unique words และ adaptive target
- Flashcard goal 10 และ Speak goal 1

### Integration

- Flashcard answer สร้างหนึ่ง event หลัง progress save
- Quiz answer สร้างหนึ่ง event หลัง result save
- Grammar answer สร้างหนึ่ง event หลัง progress save
- Speak completion สร้าง deterministic event หนึ่งรายการ
- failed progress save ต้องไม่สร้าง activity event

### Sync

- offline retry
- Pull → Merge → Push
- account switch/sign-out cancellation
- multi-device event merge
- Guest claim เฉพาะ empty User และ unclaimed Guest

### Home

- Stats แสดง streak และ daily goal จาก ledger
- Missions แสดง progress จาก event จริง
- Review mission ซ่อนเมื่อ target เป็นศูนย์
- ไม่มีค่าตัวอย่าง hard-code
- action/route เดิมยังทำงาน
- 320px ไม่มี horizontal overflow

## Acceptance Criteria

- ทุก metric บน Home สามารถตรวจย้อนกลับไปยัง qualifying event จริงได้
- event ซ้ำจาก render, retry หรือ sync ไม่ทำให้ตัวเลขเพิ่ม
- Guest ใช้งานได้โดยไม่ล็อกอิน
- Logged-in User ใช้ Local ทันทีและ sync Supabase เบื้องหลัง
- Guest Claim ทำตามข้อจำกัดเดียวกับ Vocabulary progress
- Day streak, Daily goal และ Today’s missions อัปเดตหลัง action สำเร็จ
- Offline ไม่ทำให้กิจกรรมสูญหาย
- Account switch ไม่เขียนข้อมูลข้าม User
- Home ยังคง responsive ตั้งแต่ 320px และไม่เพิ่มปุ่ม/route ใหม่
