const fs = require('fs');
const path = require('path');

const map = {
  bear: 'PawPrint', camel: 'PawPrint', cheetah: 'PawPrint', cow: 'PawPrint', crocodile: 'PawPrint',
  donkey: 'PawPrint', elephant: 'PawPrint', giraffe: 'PawPrint', goat: 'PawPrint', gorilla: 'PawPrint',
  hippo: 'PawPrint', horse: 'PawPrint', kangaroo: 'PawPrint', leopard: 'PawPrint', lion: 'PawPrint',
  monkey: 'PawPrint', panda: 'PawPrint', pig: 'PawPrint', rhino: 'PawPrint', sheep: 'PawPrint',
  snake: 'PawPrint', tiger: 'PawPrint', deer: 'PawPrint', fox: 'PawPrint', mammal: 'PawPrint',
  paw: 'PawPrint', tail: 'PawPrint',
  belt: 'Shirt', cap: 'Shirt', closet: 'Shirt', coat: 'Shirt', dress: 'Shirt', glove: 'Shirt',
  hat: 'Shirt', jacket: 'Shirt', jeans: 'Shirt', pants: 'Shirt', scarf: 'Shirt', shorts: 'Shirt',
  skirt: 'Shirt', sweater: 'Shirt', tie: 'Shirt', bowtie: 'Shirt', denim: 'Shirt',
  hood: 'Shirt', leather: 'Shirt', linen: 'Shirt', nylon: 'Shirt', silk: 'Shirt', velvet: 'Shirt',
  hanger: 'Shirt', headband: 'Shirt', ribbon: 'Shirt',
  boot: 'Footprints', shoe: 'Footprints', sock: 'Footprints', anklet: 'Footprints',
  insole: 'Footprints', shoelace: 'Footprints', socks: 'Footprints', tights: 'Footprints',
  ring: 'Gem', bracelet: 'Gem', brooch: 'Gem', earrings: 'Gem', pendant: 'Gem', gold: 'Gem', silver: 'Gem',
  arm: 'Accessibility', blonde: 'User', finger: 'Hand', knee: 'Accessibility', neck: 'User',
  nose: 'Smile', skin: 'User', toe: 'Footprints', tooth: 'Smile',
  bottle: 'GlassWater', butter: 'Beef', cheese: 'Beef', ice: 'Snowflake', pepper: 'Carrot',
  salad: 'Salad', salt: 'Utensils', snack: 'Croissant', soup: 'Soup', sugar: 'Utensils',
  sweet: 'Candy', vegetable: 'Carrot', cereal: 'Wheat', coconut: 'Apple', cucumber: 'Carrot',
  garlic: 'Carrot', honey: 'Utensils', jam: 'Apple', mango: 'Apple', mushroom: 'Carrot',
  onion: 'Carrot', papaya: 'Apple', peanut: 'Carrot', pineapple: 'Apple', plum: 'Apple',
  potato: 'Carrot', raw: 'Utensils', ripe: 'Apple', sausage: 'Beef', steak: 'Beef',
  strawberry: 'Apple', tomato: 'Apple', bake: 'CookingPot',
  colander: 'CookingPot', corkscrew: 'Utensils', grater: 'Utensils', 'rolling pin': 'Utensils',
  sieve: 'Utensils', tongs: 'Utensils',
  blanket: 'Bed', brush: 'Brush', clean: 'Sparkles', cylinder: 'Cylinder',
  grandfather: 'User', grandmother: 'User', mirror: 'Square', new: 'Sparkles',
  pillow: 'Bed', playground: 'Tent', rubber: 'Square', table: 'Table',
  toothbrush: 'Brush', toothpaste: 'Brush', towel: 'Square', cosmetics: 'Sparkles',
  cure: 'HeartPulse', engaged: 'Heart', exciting: 'Zap', galaxy: 'Star',
  perfume: 'Sparkles', rainbow: 'CloudRain', razor: 'Scissors', shadow: 'Moon',
  space: 'Rocket', vase: 'Square', butcher: 'Utensils', celebrate: 'PartyPopper',
  joy: 'Smile', smart: 'Lightbulb', breakthrough: 'Zap', phenomenon: 'Sparkles'
};

const dataPaths = [
  '../src/data/vocabulary-2000.json',
  '../src/data/vocabulary-a1.json',
  '../src/data/vocabulary-a2.json',
  '../src/data/vocabulary-b1.json',
  '../src/data/vocabulary-b2.json'
].map(p => path.join(__dirname, p));

let changed = 0;
dataPaths.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.forEach(w => {
    if (w.icon === 'Sparkles' && map[w.word]) {
      w.icon = map[w.word];
      changed++;
    }
  });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
});

console.log('Mapped', changed, 'words from Sparkles to better icons.');
