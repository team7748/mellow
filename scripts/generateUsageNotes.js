import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/vocabulary-2000.json');

function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

async function main() {
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`);
    process.exit(1);
  }

  let data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${data.length} words from dataset.`);

  console.log("Generating high-quality natural usage notes for all words...");
  
  for (let i = 0; i < data.length; i++) {
    const wordObj = data[i];
    const w = wordObj.word;
    const meaning = wordObj.thaiMeaning;
    const example = wordObj.example || '';
    const pos = wordObj.partOfSpeech.toLowerCase();
    const reading = wordObj.thaiReading || w;
    const seed = getHash(w);
    
    // Natural How To Use (avoiding "ทำหน้าที่เป็น")
    const howToUses = [];
    if (pos === 'noun') {
      howToUses.push(`ใช้เรียกแทนสิ่งที่แปลว่า "${meaning}" ในประโยค`);
      howToUses.push(`คำว่า ${w} ใช้สำหรับกล่าวถึง ${meaning}`);
      howToUses.push(`เราใช้คำนี้เมื่อต้องการสื่อถึงสิ่งที่เป็น "${meaning}"`);
    } else if (pos === 'verb') {
      howToUses.push(`ใช้แสดงการกระทำที่แปลว่า "${meaning}"`);
      howToUses.push(`คำว่า ${w} ใช้สื่อถึงอาการหรือการกระทำคือการ ${meaning}`);
      howToUses.push(`เมื่อต้องการบอกว่ากำลัง ${meaning} จะใช้คำนี้ในประโยค`);
    } else if (pos === 'adjective') {
      howToUses.push(`ใช้ขยายลักษณะเพื่อบอกว่าสิ่งนั้นมีลักษณะ "${meaning}"`);
      howToUses.push(`คำว่า ${w} นิยมใช้บอกลักษณะที่แปลว่า ${meaning}`);
      howToUses.push(`ใช้เติมเข้าไปเพื่ออธิบายสภาพหรือลักษณะ "${meaning}"`);
    } else if (pos === 'adverb') {
      howToUses.push(`ใช้อธิบายเสริมว่าการกระทำนั้นๆ เกิดขึ้นแบบ "${meaning}"`);
      howToUses.push(`คำว่า ${w} ใช้เติมขยายเพื่อให้เห็นภาพการกระทำอย่าง ${meaning}`);
      howToUses.push(`ใช้บอกรายละเอียดเพิ่มเติมในแง่ของ "${meaning}"`);
    } else {
      howToUses.push(`คำว่า ${w} ใช้สื่อความหมายถึง "${meaning}" ในบริบทต่างๆ`);
      howToUses.push(`ใช้คำนี้เมื่อต้องการอธิบายเกี่ยวกับ "${meaning}"`);
      howToUses.push(`สามารถใช้คำนี้เพื่อบอกความหมายว่า "${meaning}" ได้เลย`);
    }

    // Common Situation
    const cats = wordObj.category && wordObj.category.length > 0 ? wordObj.category[0] : 'เรื่องทั่วไป';
    const commonSits = [
      `มักจะได้ยินคำว่า ${w} บ่อยๆ เวลาคุยกันในบริบทเกี่ยวกับ${cats}`,
      `คำว่า ${w} เป็นคำที่เจอบ่อยมากในสถานการณ์ที่พูดถึง${cats}`,
      `คนมักใช้ ${w} ในชีวิตประจำวัน โดยเฉพาะเวลาคุยเรื่อง${cats}`,
      `หากเป็นเรื่องเกี่ยวกับ${cats} เรามักจะเจอคำว่า ${w} อยู่เสมอ`
    ];

    // 1. Better Pronunciation Guide
    const pronunciationGuide = wordObj.thaiReading 
      ? `คำอ่าน "${wordObj.thaiReading}"` 
      : (wordObj.ipa ? `เสียงอ่าน ${wordObj.ipa}` : `คำว่า ${w}`);

    // Thai Learner Tips
    const tips = [
      `แนะนำให้ออกเสียง ${pronunciationGuide} ให้ชัดเจน จะช่วยให้ชาวต่างชาติเข้าใจได้ง่ายขึ้นมาก`,
      `ลองจำคำว่า ${w} ควบคู่ไปกับความหมาย "${meaning}" และนึกภาพตาม จะช่วยให้จำศัพท์ได้ไวขึ้น`,
      `เวลาฝึกพูดคำว่า ${w} ลองแต่งประโยคสั้นๆ ที่เชื่อมโยงกับชีวิตประจำวันดูนะ จะทำให้จำได้แม่นเลย`,
      `แนะนำให้จำการสะกดและวิธีอ่านของคำว่า ${w} ให้แม่น เพื่อให้มั่นใจเวลาต้องนำไปใช้จริง`
    ];

    // 2. POS-specific warnings
    const warnings = [];
    if (pos === 'verb') {
      warnings.push(`ระวังเรื่องการผัน Tense เมื่อใช้คำว่า ${w} ในเหตุการณ์อดีตหรืออนาคต`);
      warnings.push(`ควรดูรูปแบบกริยา 3 ช่องของ ${w} ให้ดีก่อนนำไปแต่งประโยคนะครับ`);
      warnings.push(`เวลาใช้ ${w} ลองดูตำแหน่งการวางในประโยคให้ดีๆ${example ? ` เช่น "${example}"` : ''}`);
      warnings.push(`อย่าลืมสังเกตบริบทรอบข้างก่อนใช้คำว่า ${w} เพื่อให้สื่อความหมายได้อย่างถูกต้องที่สุด`);
    } else if (pos === 'noun') {
      warnings.push(`ระวังเรื่องการใช้นามเอกพจน์/พหูพจน์ และการเติม a/an/the นำหน้า ${w}`);
      warnings.push(`เวลาใช้ ${w} ลองดูตำแหน่งการวางในประโยคให้ดีๆ${example ? ` เช่น "${example}"` : ''}`);
      warnings.push(`อย่าลืมสังเกตบริบทรอบข้างก่อนใช้คำว่า ${w} เพื่อให้สื่อความหมายได้อย่างถูกต้องที่สุด`);
      warnings.push(`เพื่อความแม่นยำเวลาใช้งานจริง แนะนำให้ดูวิธีการใช้จากประโยคตัวอย่าง${example ? ` ("${example}")` : ''} เป็นหลัก`);
    } else {
      warnings.push(`เวลาใช้ ${w} ลองดูตำแหน่งการวางในประโยคให้ดีๆ${example ? ` เช่น "${example}"` : ''}`);
      warnings.push(`อย่าลืมสังเกตบริบทรอบข้างก่อนใช้คำว่า ${w} เพื่อให้สื่อความหมายได้อย่างถูกต้องที่สุด`);
      warnings.push(`เพื่อความแม่นยำเวลาใช้งานจริง แนะนำให้ดูวิธีการใช้จากประโยคตัวอย่าง${example ? ` ("${example}")` : ''} เป็นหลัก`);
      warnings.push(`ควรระวังการวางตำแหน่งผิดในประโยค ลองอ้างอิงรูปแบบจากตัวอย่าง${example ? ` "${example}"` : ''} ประกอบดูนะครับ`);
    }

    // 3. Formality Heuristics
    let formality = 'Neutral';
    const casualWords = ['guy', 'kid', 'yeah', 'okay', 'cool', 'crazy', 'stuff', 'hi', 'bye', 'hello', 'wow', 'gosh'];
    if (casualWords.includes(w)) {
      formality = 'Casual (เป็นกันเอง)';
    } else if (wordObj.cefr === 'C1' || wordObj.cefr === 'C2') {
      formality = 'Formal (ทางการ)';
    }

    wordObj.usageNotes = {
      howToUse: howToUses[seed % howToUses.length],
      commonSituation: commonSits[(seed + 1) % commonSits.length],
      formality: formality,
      warning: warnings[(seed + 2) % warnings.length],
      thaiLearnerTip: tips[(seed + 3) % tips.length]
    };
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nSuccessfully updated all ${data.length} words with natural offline generated notes!`);
}

main().catch(error => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
