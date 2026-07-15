import { type SrsRecord, type IntervalUnit, type SessionLog } from "../types/srs"

const SRS_STORAGE_KEY = "thai_english_srs_records"

export function getSrsEnabled(): boolean {
  return localStorage.getItem("flashcard_srs_enabled") === "true"
}

export function setSrsEnabled(enabled: boolean) {
  localStorage.setItem("flashcard_srs_enabled", enabled ? "true" : "false")
}

function loadRecords(): Record<string, SrsRecord> {
  const data = localStorage.getItem(SRS_STORAGE_KEY)
  if (!data) return {}
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function saveRecords(records: Record<string, SrsRecord>) {
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(records))
}

export function getSrsRecord(wordId: string): SrsRecord | null {
  const records = loadRecords()
  const record = records[wordId]
  if (record && !record.intervalUnit) {
    record.intervalUnit = "days"
  }
  return record || null
}

export function getAllSrsRecords(): SrsRecord[] {
  const records = loadRecords()
  return Object.values(records).map(record => {
    if (!record.intervalUnit) {
      record.intervalUnit = "days"
    }
    return record
  })
}

export function createNewSrsRecord(wordId: string): SrsRecord {
  return {
    wordId,
    status: "new",
    easeFactor: 2.5,
    interval: 0,
    intervalUnit: "minutes",
    repetition: 0,
    dueDate: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    correctCount: 0,
    wrongCount: 0,
    totalReviews: 0,
  }
}

function addTime(date: Date, amount: number, unit: IntervalUnit): Date {
  const newDate = new Date(date.getTime())
  if (unit === "minutes") {
    newDate.setMinutes(newDate.getMinutes() + amount)
  } else if (unit === "hours") {
    newDate.setHours(newDate.getHours() + amount)
  } else if (unit === "days") {
    newDate.setDate(newDate.getDate() + amount)
  }
  return newDate
}

export function processSrsAnswer(wordId: string, answer: "again" | "hard" | "good" | "easy"): SrsRecord {
  const records = loadRecords()
  const record = records[wordId] || createNewSrsRecord(wordId)

  const now = new Date()
  record.lastReviewedAt = now.toISOString()
  record.totalReviews += 1

  if (answer === "again") {
    record.wrongCount += 1
    record.status = "learning"
    record.repetition = 0
    record.interval = Math.floor(Math.random() * (30 - 10 + 1)) + 10 // 10 to 30 mins
    record.intervalUnit = "minutes"
    record.easeFactor = Math.max(1.3, record.easeFactor - 0.2)
  } else if (answer === "hard") {
    record.correctCount += 1
    record.status = "learning"
    record.interval = Math.floor(Math.random() * (3 - 1 + 1)) + 1 // 1 to 3 hours
    record.intervalUnit = "hours"
    record.easeFactor = Math.max(1.3, record.easeFactor - 0.15)
  } else if (answer === "good") {
    record.correctCount += 1
    record.repetition += 1

    if (record.repetition === 1) {
      record.interval = 6
      record.intervalUnit = "hours"
      record.status = "learning"
    } else if (record.repetition === 2) {
      record.interval = 12
      record.intervalUnit = "hours"
      record.status = "learning"
    } else if (record.repetition === 3) {
      record.interval = 1
      record.intervalUnit = "days"
      record.status = "review"
    } else {
      let prevDays = record.interval
      if (record.intervalUnit === "hours") prevDays = record.interval / 24
      if (record.intervalUnit === "minutes") prevDays = record.interval / 1440
      record.interval = Math.max(1, Math.round(prevDays * record.easeFactor))
      record.intervalUnit = "days"
      record.status = "review"
    }
  } else if (answer === "easy") {
    record.correctCount += 1
    record.repetition += 1
    record.easeFactor = Math.min(3.0, record.easeFactor + 0.15)

    if (record.repetition === 1) {
      record.interval = 12
      record.intervalUnit = "hours"
      record.status = "learning"
    } else if (record.repetition === 2) {
      record.interval = 1
      record.intervalUnit = "days"
      record.status = "review"
    } else if (record.repetition === 3) {
      record.interval = 3
      record.intervalUnit = "days"
      record.status = "review"
    } else {
      let prevDays = record.interval
      if (record.intervalUnit === "hours") prevDays = record.interval / 24
      if (record.intervalUnit === "minutes") prevDays = record.interval / 1440
      record.interval = Math.max(1, Math.round(prevDays * record.easeFactor * 1.3))
      record.intervalUnit = "days"
      record.status = "review"
    }
  }

  // Mastered check
  if (record.status === "review" && record.correctCount > 5 && (record.correctCount / record.totalReviews) > 0.8 && record.intervalUnit === "days" && record.interval > 21) {
    record.status = "mastered"
  }

  record.dueDate = addTime(now, record.interval, record.intervalUnit).toISOString()

  records[wordId] = record
  saveRecords(records)

  return record
}

// 1. เลยกำหนดมากสุด 2. Due now 3. Due today 4. ผิดบ่อย 5. คำใหม่ 6. Review 7. Mastered
export function sortWordIdsBySrsPriority(wordIds: string[]): string[] {
  const records = loadRecords()
  const now = new Date()
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const sorted = [...wordIds].sort((a, b) => {
    const recA = records[a] || createNewSrsRecord(a)
    const recB = records[b] || createNewSrsRecord(b)

    const dueA = new Date(recA.dueDate)
    const dueB = new Date(recB.dueDate)

    // Calculate categories
    const getCategory = (rec: SrsRecord, due: Date) => {
      if (due < now) return 1 // Overdue / Due Now
      if (due <= todayEnd) return 2 // Due Today
      if (rec.wrongCount > Math.max(3, rec.correctCount)) return 3 // Often wrong
      if (rec.status === "new") return 4
      if (rec.status === "learning") return 5
      if (rec.status === "review") return 6
      if (rec.status === "mastered") return 7
      return 8
    }

    const catA = getCategory(recA, dueA)
    const catB = getCategory(recB, dueB)

    if (catA !== catB) return catA - catB

    // If both are overdue, sort by how overdue they are
    if (catA === 1 || catA === 2) {
      return dueA.getTime() - dueB.getTime()
    }

    // Default to sorting by wrong count
    return recB.wrongCount - recA.wrongCount
  })

  return sorted
}

// Helper for UI filters
export function getSrsStatusInfo(wordId: string): { statusLabel: string, isDue: boolean, isDueToday: boolean } {
  const record = loadRecords()[wordId]
  if (!record) return { statusLabel: "New", isDue: true, isDueToday: true }
  
  const due = new Date(record.dueDate)
  const now = new Date()
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const isDue = due <= now
  const isDueToday = due <= todayEnd

  let label = "New"
  if (record.status === "learning") label = "Learning"
  else if (record.status === "review") label = "Review"
  else if (record.status === "mastered") label = "Mastered"

  if (isDue) label = "Due Now"
  else if (isDueToday) label = "Due Today"

  return { statusLabel: label, isDue, isDueToday }
}

const SESSION_LOGS_KEY = "thai_english_srs_session_logs"

export function saveSessionLog(log: SessionLog) {
  try {
    const data = localStorage.getItem(SESSION_LOGS_KEY)
    let logs: SessionLog[] = []
    if (data) {
      logs = JSON.parse(data)
    }
    logs.push(log)
    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs))
  } catch (e) {
    console.error("Failed to save session log", e)
  }
}
