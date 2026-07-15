export const translations = {
  th: {
    "common.loading": "กำลังโหลด...",
    "common.save": "บันทึก",
    "common.retry": "ลองใหม่",
    "profile.title": "โปรไฟล์",
  },
  en: {
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.retry": "Retry",
    "profile.title": "Profile",
  },
} as const

export type TranslationKey = keyof typeof translations.th
