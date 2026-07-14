import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/vocabulary-2000.json');

function validate() {
  console.log(`Reading vocabulary dataset from ${jsonPath}...`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${data.length} words. Starting validation checks...`);

  let failed = false;
  const errors = [];

  // Sets to check diversity
  const uniqueHowToUse = new Set();
  const uniqueCommonSituation = new Set();
  const uniqueWarning = new Set();
  const uniqueThaiLearnerTip = new Set();

  const requiredKeys = ['howToUse', 'commonSituation', 'formality', 'warning', 'thaiLearnerTip'];
  const templatePatterns = [
    /ทำหน้าที่เป็น/,
    /จัดเป็น/,
    /ระดับ\s*[AB]/,
    /เป็นคำนาม/
  ];

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const wordId = entry.id;
    const word = entry.word;

    // 1. Verify usageNotes object exists
    if (!entry.usageNotes) {
      errors.push(`[${wordId} - ${word}]: Missing usageNotes object.`);
      failed = true;
      continue;
    }

    const notes = entry.usageNotes;
    const keys = Object.keys(notes);

    // 2. Verify exact keys
    const hasExactlyRequiredKeys = requiredKeys.every(k => keys.includes(k)) && keys.length === requiredKeys.length;
    if (!hasExactlyRequiredKeys) {
      errors.push(`[${wordId} - ${word}]: Keys mismatch. Expected strictly [${requiredKeys.join(', ')}], found [${keys.join(', ')}].`);
      failed = true;
    }

    for (const key of requiredKeys) {
      const val = notes[key];

      // 3. Verify no null, undefined, empty, or whitespace-only values
      if (val === undefined || val === null) {
        errors.push(`[${wordId} - ${word}]: Field "${key}" is null or undefined.`);
        failed = true;
        continue;
      }
      if (typeof val !== 'string') {
        errors.push(`[${wordId} - ${word}]: Field "${key}" is not a string. Found type: ${typeof val}.`);
        failed = true;
        continue;
      }
      const trimmed = val.trim();
      if (trimmed === '') {
        errors.push(`[${wordId} - ${word}]: Field "${key}" is empty or whitespace-only.`);
        failed = true;
        continue;
      }

      // 4. Verify no template patterns
      for (const pattern of templatePatterns) {
        if (pattern.test(trimmed)) {
          errors.push(`[${wordId} - ${word}]: Field "${key}" contains template pattern "${pattern.toString()}". Value: "${trimmed}"`);
          failed = true;
        }
      }

      // 5. Verify diversity / uniqueness (excluding formality)
      if (key !== 'formality') {
        let setToCheck;
        if (key === 'howToUse') setToCheck = uniqueHowToUse;
        else if (key === 'commonSituation') setToCheck = uniqueCommonSituation;
        else if (key === 'warning') setToCheck = uniqueWarning;
        else if (key === 'thaiLearnerTip') setToCheck = uniqueThaiLearnerTip;

        if (setToCheck) {
          if (setToCheck.has(trimmed)) {
            errors.push(`[${wordId} - ${word}]: Field "${key}" has duplicate value (violates diversity): "${trimmed}"`);
            failed = true;
          } else {
            setToCheck.add(trimmed);
          }
        }
      }
    }
  }

  if (failed) {
    console.error(`\nValidation FAILED! Total errors/warnings found: ${errors.length}`);
    // Log the first 20 errors to avoid console flood
    console.error('Showing first 20 errors:');
    errors.slice(0, 20).forEach(err => console.error(` - ${err}`));
    process.exit(1);
  } else {
    console.log(`\nValidation PASSED! Checked ${data.length} words successfully. All criteria (completeness, keys, non-emptiness, template-free, diversity) satisfied.`);
    process.exit(0);
  }
}

validate();
