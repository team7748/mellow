import type { VocabCategory } from "../types/vocabulary"

/**
 * Maps each vocabulary category to its icon name string.
 * The icon name should exist in vocabIconMap for resolution.
 */
export const categoryIconMap: Record<VocabCategory, string> = {
  "Daily Life": "Home",
  "Bedroom": "Bed",
  "Bathroom": "Bath",
  "Kitchen": "CookingPot",
  "Food & Drinks": "Utensils",
  "Body & Health": "Heart",
  "Clothes": "Shirt",
  "People & Family": "Users",
  "School & Work": "Briefcase",
  "Places": "MapPin",
  "Travel": "Bus",
  "Shopping & Money": "ShoppingBag",
  "Feelings": "Smile",
  "Objects": "Package",
  "Basic Actions": "Zap",
  "Nature & Animals": "Leaf",
  "Technology": "Monitor",
}

/** Thai labels for each category */
export const categoryThaiLabels: Record<VocabCategory, string> = {
  "Daily Life": "ชีวิตประจำวัน",
  "Bedroom": "ห้องนอน",
  "Bathroom": "ห้องน้ำ",
  "Kitchen": "ห้องครัว",
  "Food & Drinks": "อาหารและเครื่องดื่ม",
  "Body & Health": "ร่างกายและสุขภาพ",
  "Clothes": "เสื้อผ้า",
  "People & Family": "คนและครอบครัว",
  "School & Work": "โรงเรียนและงาน",
  "Places": "สถานที่",
  "Travel": "การเดินทาง",
  "Shopping & Money": "ซื้อของและเงิน",
  "Feelings": "ความรู้สึก",
  "Objects": "สิ่งของ",
  "Basic Actions": "การกระทำพื้นฐาน",
  "Nature & Animals": "ธรรมชาติและสัตว์",
  "Technology": "เทคโนโลยี",
}

/** All available categories in display order */
export const allCategories: VocabCategory[] = [
  "Daily Life",
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "Food & Drinks",
  "Body & Health",
  "Clothes",
  "People & Family",
  "School & Work",
  "Places",
  "Travel",
  "Shopping & Money",
  "Feelings",
  "Objects",
  "Basic Actions",
]
