import type { VocabularyItem, CefrLevel, PartOfSpeech, VocabCategory, MemoryStatus } from "../types/vocabulary";
import c1c2Data from "../data/c1_c2_advanced_vocabulary_200_words.json";

/**
 * Maps C1/C2 raw category strings to the existing VocabCategory system.
 * This ensures no new categories are created — all words fit into the
 * existing category taxonomy.
 */
const C1C2_CATEGORY_MAP: Record<string, VocabCategory> = {
  // Daily life
  "daily_life": "Daily Life",

  // Body & Health
  "health": "Body & Health",

  // School & Work (professional, academic)
  "analysis": "School & Work",
  "business": "School & Work",
  "career": "School & Work",
  "education": "School & Work",
  "formal": "School & Work",
  "job": "School & Work",
  "law": "School & Work",
  "literature": "School & Work",
  "meeting": "School & Work",
  "presentation": "School & Work",
  "review": "School & Work",
  "study": "School & Work",
  "teamwork": "School & Work",
  "work": "School & Work",
  "writing": "School & Work",

  // Shopping & Money
  "finance": "Shopping & Money",

  // People & Family (social, human relations)
  "communication": "People & Family",
  "culture": "People & Family",
  "ethics": "People & Family",
  "politics": "People & Family",
  "relationship": "People & Family",
  "society": "People & Family",

  // Technology & Media
  "data": "Technology",
  "design": "Technology",
  "media": "Technology",
  "news": "Technology",
  "technology": "Technology",

  // Nature & Animals
  "nature": "Nature & Animals",

  // Travel
  "travel": "Travel",

  // Basic Actions (creative, expressive)
  "creative": "Basic Actions",
};

/**
 * Resolves a raw C1/C2 category string to the existing VocabCategory.
 * Falls back to "Daily Life" if no mapping is found.
 */
function resolveCategory(rawCategory: string): VocabCategory {
  const key = rawCategory.toLowerCase().replace(/\s+/g, "_");
  return C1C2_CATEGORY_MAP[key] ?? "Daily Life";
}

/**
 * Maps C1/C2 raw category to an appropriate Lucide icon name.
 * Uses meaningful icons that represent the topic/domain.
 */
const C1C2_ICON_MAP: Record<string, string> = {
  // Work & Professional
  "work":         "Briefcase",
  "business":     "TrendingUp",
  "career":       "Target",
  "job":          "ClipboardList",
  "meeting":      "Users",
  "teamwork":     "Handshake",
  "presentation": "Presentation",
  "formal":       "FileText",
  "analysis":     "BarChart3",
  "review":       "FileCheck",
  "writing":      "PenTool",
  "law":          "Gavel",
  // Education & Knowledge
  "study":        "GraduationCap",
  "education":    "BookOpen",
  "literature":   "BookOpenText",
  // Tech & Data
  "technology":   "Laptop",
  "data":         "Database",
  "design":       "Palette",
  "media":        "Megaphone",
  "news":         "Newspaper",
  // People & Society
  "communication": "MessageCircle",
  "relationship":  "HeartHandshake",
  "society":       "Globe",
  "culture":       "Landmark",
  "ethics":        "Scale",
  "politics":      "Vote",
  // Money
  "finance":      "Coins",
  // Health
  "health":       "HeartPulse",
  // Nature & Travel
  "nature":       "Leaf",
  "travel":       "Plane",
  // Daily life & Creative
  "daily_life":   "Home",
  "creative":     "Sparkles",
};

/**
 * Per-word icon map — unique icon matching each word's meaning.
 * Covers all 200 C1/C2 words.
 */
const WORD_ICON_MAP: Record<string, string> = {
  // ── C1 ──────────────────────────────────────────────
  "abandon":       "Trash2",
  "abstract":      "Layers",
  "accelerate":    "FastForward",
  "accessible":    "Unlock",
  "accommodate":   "Hotel",
  "accumulate":    "Archive",
  "accurate":      "Crosshair",
  "acknowledge":   "CheckCircle",
  "adapt":         "RefreshCw",
  "adequate":      "CheckSquare",
  "adjacent":      "ArrowLeftRight",
  "advocate":      "Megaphone",
  "allege":        "MessageSquareWarning",
  "allocate":      "PieChart",
  "ambiguous":     "HelpCircle",
  "amend":         "PencilLine",
  "anticipate":    "Eye",
  "apparatus":     "Wrench",
  "applicable":    "ListChecks",
  "arbitrary":     "Dices",
  "assert":        "MessageSquareQuote",
  "asset":         "Gem",
  "assign":        "ArrowRight",
  "assumption":    "Lightbulb",
  "attain":        "Trophy",
  "attribute":     "Tag",
  "authority":     "Crown",
  "bias":          "AlertTriangle",
  "brief":         "FileText",
  "capacity":      "BatteryCharging",
  "cease":         "Ban",
  "challenge":     "Swords",
  "clarify":       "Lightbulb",
  "coherent":      "AlignJustify",
  "coincide":      "CalendarCheck",
  "collapse":      "TrendingDown",
  "commence":      "Play",
  "compatible":    "Puzzle",
  "compile":       "FolderKanban",
  "complement":    "Combine",
  "comprehensive": "ListChecks",
  "conceive":      "Brain",
  "confer":        "MessagesSquare",
  "confine":       "Lock",
  "consecutive":   "CalendarDays",
  "consensus":     "Handshake",
  "considerable":  "TrendingUp",
  "constitute":    "Shapes",
  "constrain":     "Lock",
  "consult":       "MessageCircle",
  "contradict":    "ArrowRightLeft",
  "controversy":   "AlertOctagon",
  "convene":       "Users",
  "conversely":    "ArrowLeftRight",
  "coordinate":    "Waypoints",
  "core":          "Target",
  "corporate":     "Building2",
  "correspond":    "Mail",
  "criteria":      "ListChecks",
  "crucial":       "Star",
  "deduce":        "Brain",
  "deficiency":    "BatteryWarning",
  "demonstrate":   "Presentation",
  "denote":        "Hash",
  "depict":        "ImageIcon",
  "derive":        "GitBranch",
  "deviate":       "Route",
  "differentiate": "GitCompare",
  "dimension":     "Ruler",
  "diminish":      "TrendingDown",
  "discrete":      "CircleDot",
  "displace":      "MoveRight",
  "dispose":       "Recycle",
  "distinct":      "Diamond",
  "distort":       "AlertCircle",
  "diverse":       "Palette",
  "domain":        "Globe",
  "duration":      "Timer",
  "dynamic":       "Activity",
  "eliminate":     "XCircle",
  "empirical":     "FlaskConical",
  "enable":        "Power",
  "encounter":     "Footprints",
  "enforce":       "Shield",
  "enhance":       "Sparkles",
  "equivalent":    "Scale",
  "erode":         "TrendingDown",
  "establish":     "Anchor",
  "evaluate":      "BarChart3",
  "evident":       "Eye",
  "evolve":        "RefreshCw",
  "exceed":        "ArrowUpCircle",
  "exclude":       "UserMinus",
  "exploit":       "Wrench",
  "exposure":      "Camera",
  "external":      "Globe2",
  "facilitate":    "Handshake",
  "feasible":      "CheckCircle",
  "fluctuate":     "Activity",
  "framework":     "Layers",
  // ── C2 ──────────────────────────────────────────────
  "aberration":    "CircleDashed",
  "abhor":         "ThumbsDown",
  "abrogate":      "Gavel",
  "acquiesce":     "HandHeart",
  "acrimonious":   "Angry",
  "adroit":        "Zap",
  "aesthetic":     "Palette",
  "affluent":      "Coins",
  "alacrity":      "FastForward",
  "ameliorate":    "HeartPulse",
  "anachronism":   "History",
  "anomaly":       "AlertCircle",
  "antagonize":    "Swords",
  "apathetic":     "Meh",
  "apocryphal":    "Ghost",
  "apprehensive":  "EyeOff",
  "archetype":     "Crown",
  "ascertain":     "Search",
  "assiduous":     "Award",
  "austere":       "Minimize",
  "belligerent":   "Swords",
  "benign":        "HeartPulse",
  "boisterous":    "Megaphone",
  "cacophony":     "AlertOctagon",
  "capricious":    "Wind",
  "censure":       "Gavel",
  "chicanery":     "EyeOff",
  "circumspect":   "Shield",
  "clandestine":   "Lock",
  "cogent":        "CheckCircle",
  "commensurate":  "Scale",
  "compunction":   "Heart",
  "conciliatory":  "HeartHandshake",
  "conflagration": "Flame",
  "conundrum":     "Puzzle",
  "copious":       "Archive",
  "corroborate":   "ShieldCheck",
  "deleterious":   "HeartCrack",
  "demagogue":     "Megaphone",
  "denigrate":     "ThumbsDown",
  "deprecate":     "Ban",
  "deride":        "Frown",
  "despot":        "Crown",
  "detrimental":   "TriangleAlert",
  "diaphanous":    "Feather",
  "didactic":      "GraduationCap",
  "diffident":     "Minimize",
  "dilatory":      "Clock",
  "disparate":     "GitCompare",
  "dissemble":     "Ghost",
  "ebullient":     "PartyPopper",
  "eclectic":      "Palette",
  "efficacy":      "Trophy",
  "egregious":     "AlertOctagon",
  "elucidate":     "Lightbulb",
  "emulate":       "Copy",
  "enervate":      "BatteryWarning",
  "ephemeral":     "Timer",
  "equanimity":    "Scale",
  "equivocate":    "CircleDashed",
  "erudite":       "BookOpenText",
  "esoteric":      "Lock",
  "evanescent":    "Feather",
  "exacerbate":    "Flame",
  "exculpate":     "ShieldCheck",
  "execrable":     "ThumbsDown",
  "exigent":       "AlertCircle",
  "exonerate":     "ShieldCheck",
  "facetious":     "SmilePlus",
  "fastidious":    "Crosshair",
  "feckless":      "AlertTriangle",
  "fecund":        "Sprout",
  "feral":         "PawPrint",
  "florid":        "Flower2",
  "fractious":     "AlertTriangle",
  "garrulous":     "Mic",
  "gratuitous":    "XCircle",
  "gregarious":    "Users",
  "hackneyed":     "Repeat",
  "hegemony":      "Crown",
  "iconoclast":    "Hammer",
  "idiosyncrasy":  "Star",
  "impecunious":   "PiggyBank",
  "impetuous":     "Zap",
  "implacable":    "Lock",
  "inchoate":      "CircleDashed",
  "indefatigable": "Dumbbell",
  "ineffable":     "Infinity",
  "inexorable":    "ArrowRight",
  "inimical":      "AlertTriangle",
  "inscrutable":   "EyeOff",
  "intrepid":      "Mountain",
  "inveterate":    "RotateCw",
  "juxtapose":     "ArrowLeftRight",
  "lachrymose":    "Droplet",
  "laconic":       "AlignCenter",
  "magnanimous":   "Gift",
  "malediction":   "AlertOctagon",
  "mendacious":    "EyeOff",
  "mercurial":     "Wind",
};

/**
 * Part-of-speech fallback icons when no word-specific icon is found.
 */
const POS_ICON_MAP: Record<string, string> = {
  "verb":       "Zap",
  "noun":       "Package",
  "adjective":  "Sparkles",
  "adverb":     "ArrowUpRight",
};

function resolveIcon(word: string, rawCategory: string, partOfSpeech: string): string {
  const wordKey = word.toLowerCase().trim();
  if (WORD_ICON_MAP[wordKey]) return WORD_ICON_MAP[wordKey];

  const catKey = rawCategory.toLowerCase().replace(/\s+/g, "_");
  if (C1C2_ICON_MAP[catKey]) return C1C2_ICON_MAP[catKey];

  return POS_ICON_MAP[partOfSpeech?.toLowerCase()] ?? "GraduationCap";
}



export function getC1C2Vocabulary(): VocabularyItem[] {
  const allWords: any[] = [
    ...(c1c2Data.levels?.C1 || []),
    ...(c1c2Data.levels?.C2 || [])
  ];

  return allWords.map(wordData => {
    // Determine a primary context for backward compatibility
    const defaultContextObj = wordData.contexts?.[0] || { situation: "general", sentenceEN: "", noteTH: "" };

    const mappedItem: VocabularyItem = {
      id: wordData.id,
      sourceId: wordData.id,
      sourceScenario: "C1C2_Advanced",
      scenario: defaultContextObj.situation,
      scenarioThai: "ระดับสูง (C1-C2)",
      word: wordData.word,
      cefr: wordData.level as CefrLevel,
      partOfSpeech: wordData.partOfSpeech,
      partOfSpeechStandard: wordData.partOfSpeech as PartOfSpeech,
      ipa: "", // C1/C2 data doesn't have IPA currently
      thaiReading: "", // Missing from C1/C2 data
      thaiPronunciation: "", 
      thaiMeaning: wordData.thaiMeaning,
      simpleMeaning: wordData.thaiMeaning,
      example: defaultContextObj.sentenceEN,
      exampleThai: defaultContextObj.noteTH,
      contexts: {
        daily: { meaning: "", example: "", thaiExample: "" },
        work: { meaning: "", example: "", thaiExample: "" },
        study: { meaning: "", example: "", thaiExample: "" },
      },
      synonyms: [],
      commonMistake: "",
      memoryTip: wordData.usageContextTH || "",
      allocationStatus: "Advanced",
      memoryStatus: "New" as MemoryStatus,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      // Map to existing category — no new categories created
      category: [resolveCategory(wordData.category)],
      subcategory: "",
      level: 3,
      
      // Custom C1/C2 fields
      tags: wordData.tags || [],
      usageContextTH: wordData.usageContextTH,
      flashcard: wordData.flashcard,
      quiz: wordData.quiz,
      
      // Map contexts to contextExamples for deep context display
      contextExamples: wordData.contexts?.map((ctx: any) => ({
        situation: ctx.situation,
        explanationThai: ctx.noteTH,          // usage note / hint
        exampleEn: ctx.sentenceEN,
        exampleThai: ctx.sentenceTH || ""     // real Thai sentence translation
      })) || [],
      
      icon: resolveIcon(wordData.word, wordData.category, wordData.partOfSpeech)
    };

    // Populate the scenario specifically if it's daily, work, or study
    const situation = defaultContextObj.situation;
    if (situation === "daily" || situation === "work" || situation === "study") {
      mappedItem.contexts[situation] = {
        meaning: wordData.thaiMeaning,
        example: defaultContextObj.sentenceEN,
        thaiExample: defaultContextObj.noteTH
      };
    } else {
      mappedItem.contexts[situation] = {
        meaning: wordData.thaiMeaning,
        example: defaultContextObj.sentenceEN,
        thaiExample: defaultContextObj.noteTH
      };
    }

    return mappedItem;
  });
}
