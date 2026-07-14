const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, '../src/data/chunks');
const outputRaw = path.join(__dirname, '../src/data/vocabulary-raw-2000.json');
const outputApp = path.join(__dirname, '../src/data/vocabulary-2000.json');

const VALID_CATEGORIES = [
  "Daily Life", "Bedroom", "Bathroom", "Kitchen", "Food & Drinks", 
  "Body & Health", "Clothes", "People & Family", "School & Work", 
  "Places", "Travel", "Shopping & Money", "Feelings", "Objects", "Basic Actions"
];

const VALID_POS = ["noun", "verb", "adjective", "adverb", "phrase", "other"];
const VALID_CEFR = ["A1", "A2", "B1", "B2"];

function mapCategory(rawCat) {
  if (!rawCat) return "Objects";
  const cat = rawCat.toLowerCase();
  if (cat.includes("food") || cat.includes("diet") || cat.includes("grocer") || cat.includes("drink") || cat.includes("nutrition")) return "Food & Drinks";
  if (cat.includes("school") || cat.includes("work") || cat.includes("profession") || cat.includes("career") || cat.includes("employment")) return "School & Work";
  if (cat.includes("travel") || cat.includes("vehicle") || cat.includes("transport") || cat.includes("tour")) return "Travel";
  if (cat.includes("feel") || cat.includes("emotion") || cat.includes("relation") || cat.includes("personalit")) return "Feelings";
  if (cat.includes("cloth") || cat.includes("fashion") || cat.includes("accessor") || cat.includes("jewel") || cat.includes("footwear")) return "Clothes";
  if (cat.includes("body") || cat.includes("health") || cat.includes("sick") || cat.includes("med") || cat.includes("hygiene")) return "Body & Health";
  if (cat.includes("bed")) return "Bedroom";
  if (cat.includes("bath")) return "Bathroom";
  if (cat.includes("kitchen")) return "Kitchen";
  if (cat.includes("place") || cat.includes("build") || cat.includes("city") || cat.includes("geography")) return "Places";
  if (cat.includes("shop") || cat.includes("money") || cat.includes("bank")) return "Shopping & Money";
  if (cat.includes("people") || cat.includes("family")) return "People & Family";
  if (cat.includes("action") || cat.includes("verb") || cat.includes("sport") || cat.includes("hobby")) return "Basic Actions";
  if (cat.includes("daily") || cat.includes("time") || cat.includes("day") || cat.includes("month") || cat.includes("season") || cat.includes("weather") || cat.includes("routine")) return "Daily Life";
  
  if (cat.includes("animal") || cat.includes("wildlife") || cat.includes("pet") || cat.includes("insect")) return "Objects";
  if (cat.includes("environment") || cat.includes("nature") || cat.includes("space")) return "Places";
  if (cat.includes("tech") || cat.includes("media") || cat.includes("internet") || cat.includes("comput")) return "Objects";
  
  return "Objects";
}

function mapPOS(rawPos) {
  if (!rawPos) return "other";
  const p = rawPos.toLowerCase();
  if (p.includes("noun")) return "noun";
  if (p.includes("verb") || p.includes("action")) return "verb";
  if (p.includes("adj")) return "adjective";
  if (p.includes("adv")) return "adverb";
  if (p.includes("phrase")) return "phrase";
  return "other";
}

function runAudit() {
  console.log('Loading chunks...');
  const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.json'));
  let allWords = [];
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf8'));
      allWords = allWords.concat(data);
    } catch (e) {
      console.error('Error reading', file, e);
    }
  });

  const uniqueMap = new Map();
  allWords.forEach(w => {
    const key = (w.word || '').toLowerCase().trim();
    if (key && !uniqueMap.has(key)) uniqueMap.set(key, w);
  });
  
  let uniqueWords = Array.from(uniqueMap.values()).sort((a, b) => a.word.localeCompare(b.word));
  
  const a1 = uniqueWords.filter(w => w.cefr === 'A1').slice(0, 600);
  const a2 = uniqueWords.filter(w => w.cefr === 'A2').slice(0, 700);
  const b1 = uniqueWords.filter(w => w.cefr === 'B1').slice(0, 500);
  const b2 = uniqueWords.filter(w => w.cefr === 'B2').slice(0, 200);
  
  const finalWords = [...a1, ...a2, ...b1, ...b2];
  
  let fixes = {
    missingFields: 0,
    invalidPOS: 0,
    invalidCategory: 0,
    longSentences: 0
  };

  const auditedData = finalWords.map((w, i) => {
    let cefr = w.cefr || 'A1';
    let id = `word_${cefr.toLowerCase()}_${(i + 1).toString().padStart(4, '0')}`;
    
    let pos = mapPOS(w.partOfSpeech);
    if (pos !== w.partOfSpeech) fixes.invalidPOS++;
    
    let originalCategory = Array.isArray(w.category) ? w.category.join(", ") : w.category;
    let cat = VALID_CATEGORIES.includes(originalCategory) ? originalCategory : mapCategory(originalCategory);
    if (cat !== originalCategory) fixes.invalidCategory++;
    
    let example = w.exampleSentence || w.example || '';
    if (example.split(' ').length > 15) {
      fixes.longSentences++;
    }
    
    let thaiMeaning = w.thaiMeaning || '';
    let exampleThai = w.exampleThai || '';
    let simpleDefinition = w.simpleDefinition || w.simpleMeaning || '';
    
    const requiredFields = ['word', 'phonetic', 'partOfSpeech', 'cefr', 'category', 'thaiMeaning', 'simpleDefinition', 'exampleSentence', 'exampleThai', 'iconName', 'iconSource', 'imagePrompt', 'tags'];
    requiredFields.forEach(f => {
      if (w[f] === undefined) {
        fixes.missingFields++;
      }
    });

    return {
      id: id,
      word: w.word.toLowerCase().trim(),
      phonetic: w.phonetic || w.ipa || '',
      partOfSpeech: pos,
      cefr: cefr,
      category: cat,
      thaiMeaning: thaiMeaning,
      simpleDefinition: simpleDefinition,
      exampleSentence: example,
      exampleThai: exampleThai,
      iconName: w.iconName || w.icon || 'Sparkles',
      iconSource: w.iconSource || 'lucide',
      imagePrompt: w.imagePrompt || '',
      tags: Array.isArray(w.tags) ? w.tags : []
    };
  });

  fs.writeFileSync(outputRaw, JSON.stringify(auditedData, null, 2));
  
  const appData = auditedData.map(w => ({
    id: w.id,
    word: w.word,
    cefr: w.cefr,
    partOfSpeech: w.partOfSpeech,
    ipa: w.phonetic,
    thaiMeaning: w.thaiMeaning,
    simpleMeaning: w.simpleDefinition,
    example: w.exampleSentence,
    exampleThai: w.exampleThai,
    icon: w.iconName,
    category: [w.category],
    tags: w.tags
  }));
  
  fs.writeFileSync(outputApp, JSON.stringify(appData, null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/vocabulary-a1.json'), JSON.stringify(appData.filter(w=>w.cefr==='A1'), null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/vocabulary-a2.json'), JSON.stringify(appData.filter(w=>w.cefr==='A2'), null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/vocabulary-b1.json'), JSON.stringify(appData.filter(w=>w.cefr==='B1'), null, 2));
  fs.writeFileSync(path.join(__dirname, '../src/data/vocabulary-b2.json'), JSON.stringify(appData.filter(w=>w.cefr==='B2'), null, 2));

  console.log(JSON.stringify({
    total: auditedData.length,
    a1: auditedData.filter(w=>w.cefr==='A1').length,
    a2: auditedData.filter(w=>w.cefr==='A2').length,
    b1: auditedData.filter(w=>w.cefr==='B1').length,
    b2: auditedData.filter(w=>w.cefr==='B2').length,
    fixes
  }, null, 2));
}

runAudit();
