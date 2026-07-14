const fs = require('fs');
const path = require('path');
const dir = 'src';

fs.renameSync(path.join(dir, 'components/layout/Container.tsx'), path.join(dir, 'components/layout/PageContainer.tsx'));

const filesToUpdate = [
  'src/App.tsx',
  'src/pages/AuthPage.tsx',
  'src/pages/FlashcardPage.tsx',
  'src/pages/GrammarLessonPage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/QuizPage.tsx',
  'src/pages/SpeakModePage.tsx',
  'src/pages/VocabularyPage.tsx',
  'src/pages/WordDetailPage.tsx',
  'src/components/layout/PageContainer.tsx'
];

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ Container \} from \"(.*?)components\/layout\/Container\"/g, 'import { PageContainer } from "$1components/layout/PageContainer"');
  content = content.replace(/import \{ Container \} from \'\.\.\/components\/layout\/Container\'/g, "import { PageContainer } from '../components/layout/PageContainer'");
  content = content.replace(/<Container/g, '<PageContainer');
  content = content.replace(/<\/Container>/g, '</PageContainer>');
  if (file.includes('PageContainer.tsx')) {
    content = content.replace(/ContainerProps/g, 'PageContainerProps');
    content = content.replace(/function Container/g, 'function PageContainer');
  }
  fs.writeFileSync(file, content);
});
console.log('Renamed Container to PageContainer successfully');
