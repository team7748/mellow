const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, '../src/data/chunks');
const outputDir = path.join(__dirname, '../src/data');

function mergeVocabularies() {
  console.log('Starting vocabulary merge process...');
  
  if (!fs.existsSync(chunksDir)) {
    console.error('Chunks directory not found!');
    return;
  }

  const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.json'));
  let allWords = [];
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf8'));
      allWords = allWords.concat(data);
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  });

  console.log(`Total words loaded from chunks: ${allWords.length}`);

  // Deduplicate by word (case insensitive)
  const uniqueMap = new Map();
  allWords.forEach(w => {
    const key = w.word.toLowerCase().trim();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, w);
    }
  });

  let uniqueWords = Array.from(uniqueMap.values());
  console.log(`Total unique words: ${uniqueWords.length}`);

  // Sort words alphabetically
  uniqueWords.sort((a, b) => a.word.localeCompare(b.word));

  // Separate by CEFR
  const a1 = uniqueWords.filter(w => w.cefr === 'A1');
  const a2 = uniqueWords.filter(w => w.cefr === 'A2');
  const b1 = uniqueWords.filter(w => w.cefr === 'B1');
  const b2 = uniqueWords.filter(w => w.cefr === 'B2');

  console.log(`A1 count: ${a1.length} (Target: 600)`);
  console.log(`A2 count: ${a2.length} (Target: 700)`);
  console.log(`B1 count: ${b1.length} (Target: 500)`);
  console.log(`B2 count: ${b2.length} (Target: 200)`);

  // Truncate to exact quotas if necessary
  const finalA1 = a1.slice(0, 600);
  const finalA2 = a2.slice(0, 700);
  const finalB1 = b1.slice(0, 500);
  const finalB2 = b2.slice(0, 200);

  const finalVocab = [...finalA1, ...finalA2, ...finalB1, ...finalB2];
  
  // Re-assign IDs sequentially
  finalVocab.forEach((w, index) => {
    w.id = `word_${w.cefr.toLowerCase()}_${(index + 1).toString().padStart(4, '0')}`;
  });

  console.log(`Final total words: ${finalVocab.length} (Target: 2000)`);

  // Write files
  fs.writeFileSync(path.join(outputDir, 'vocabulary-2000.json'), JSON.stringify(finalVocab, null, 2));
  fs.writeFileSync(path.join(outputDir, 'vocabulary-a1.json'), JSON.stringify(finalA1, null, 2));
  fs.writeFileSync(path.join(outputDir, 'vocabulary-a2.json'), JSON.stringify(finalA2, null, 2));
  fs.writeFileSync(path.join(outputDir, 'vocabulary-b1.json'), JSON.stringify(finalB1, null, 2));
  fs.writeFileSync(path.join(outputDir, 'vocabulary-b2.json'), JSON.stringify(finalB2, null, 2));

  console.log('Successfully generated all vocabulary files in src/data/');
}

mergeVocabularies();
