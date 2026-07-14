const fs = require('fs');
const path = require('path');

const dataPaths = [
  '../src/data/vocabulary-2000.json',
  '../src/data/vocabulary-a1.json',
  '../src/data/vocabulary-a2.json',
  '../src/data/vocabulary-b1.json',
  '../src/data/vocabulary-b2.json'
].map(p => path.join(__dirname, p));

const techTags = ['tech', 'computer', 'software', 'internet', 'device', 'digital', 'computing', 'app', 'web', 'machine'];
const natureTags = ['animal', 'nature', 'zoo', 'wild', 'bird', 'fish', 'tree', 'weather', 'pet', 'insect', 'plant', 'space', 'environment', 'planet'];
const workTags = ['business', 'office', 'work', 'career', 'job', 'company'];
const placeTags = ['place', 'building', 'city', 'location', 'geography'];

function rebalanceCategory(w) {
  if (!w.category || w.category.length === 0) return ["Objects"];
  
  if (w.category[0] === 'Objects') {
    const tagsStr = (w.tags || []).join(' ').toLowerCase();
    
    if (techTags.some(t => tagsStr.includes(t))) return ["Technology"];
    if (natureTags.some(t => tagsStr.includes(t))) return ["Nature & Animals"];
    if (workTags.some(t => tagsStr.includes(t))) return ["School & Work"];
    if (placeTags.some(t => tagsStr.includes(t))) return ["Places"];
    
    // Check the word itself as a fallback
    const word = w.word.toLowerCase();
    if (['bear', 'cat', 'dog', 'lion', 'tiger', 'bird', 'fish', 'sun', 'moon', 'star'].includes(word)) return ["Nature & Animals"];
    if (['phone', 'computer', 'laptop', 'screen', 'algorithm', 'app'].includes(word)) return ["Technology"];
  }
  return w.category;
}

function cleanDefinition(def) {
  if (!def) return '';
  let str = def.trim();
  if (str.endsWith('.')) {
    str = str.slice(0, -1);
  }
  
  // Lowercase the first letter if it's uppercase
  if (str.length > 0) {
    const first = str.charAt(0);
    // don't lowercase if the second letter is also uppercase (acronym) or it's a known proper noun.
    // simpler heuristic: just lowercase if it's a normal letter
    if (first.match(/[A-Z]/) && (str.length === 1 || !str.charAt(1).match(/[A-Z]/))) {
      str = first.toLowerCase() + str.slice(1);
    }
  }
  return str;
}

function cleanExample(ex) {
  if (!ex) return '';
  let str = ex.trim();
  if (str.length > 0) {
    // capitalize first letter
    str = str.charAt(0).toUpperCase() + str.slice(1);
    
    // ensure ends with punctuation
    const last = str.charAt(str.length - 1);
    if (!['.', '?', '!'].includes(last)) {
      str += '.';
    }
  }
  return str;
}

let rebalancedCount = 0;
let cleanDefCount = 0;
let cleanExCount = 0;

dataPaths.forEach(file => {
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.forEach(w => {
    // 1. Rebalance category
    const newCat = rebalanceCategory(w);
    if (newCat[0] !== w.category[0]) {
      if (file.includes('vocabulary-2000')) rebalancedCount++;
      w.category = newCat;
    }
    
    // 2. Clean simpleMeaning
    const oldDef = w.simpleMeaning;
    w.simpleMeaning = cleanDefinition(w.simpleMeaning);
    if (oldDef !== w.simpleMeaning && file.includes('vocabulary-2000')) cleanDefCount++;
    
    // 3. Clean example
    const oldEx = w.example;
    w.example = cleanExample(w.example);
    if (oldEx !== w.example && file.includes('vocabulary-2000')) cleanExCount++;
  });
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
});

console.log({ rebalancedCount, cleanDefCount, cleanExCount });
