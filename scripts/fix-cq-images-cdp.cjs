/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const eol = '\r\n';
const filePath = 'src/components/classes/ChapterDetailPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// 1. Add SafeImage import
const importPattern = "import RichContentRenderer from '@/components/ui/rich-content-renderer'";
if (content.includes(importPattern) && !content.includes('SafeImage')) {
  content = content.replace(importPattern, "import SafeImage from '@/components/ui/safe-image'" + eol + "import RichContentRenderer from '@/components/ui/rich-content-renderer'");
  changes++;
  console.log('Applied SafeImage import');
}

// 2. Add questionImage, answerImage to CQQuestion
const cqQuestionEnd = '  answer: string' + eol + '}';
const cqQuestionReplacement = '  answer: string' + eol + '  questionImage?: string | null' + eol + '  answerImage?: string | null' + eol + '}';
if (content.includes(cqQuestionEnd)) {
  content = content.replace(cqQuestionEnd, cqQuestionReplacement);
  changes++;
  console.log('Applied CQQuestion interface update');
}

// 3. Add uddeepokImage to CQDetailItem
const cqDetailInsert = '  uddeepok: string' + eol + '  questions: CQQuestion[]';
const cqDetailReplacement = '  uddeepok: string' + eol + '  uddeepokImage?: string | null' + eol + '  questions: CQQuestion[]';
if (content.includes(cqDetailInsert)) {
  content = content.replace(cqDetailInsert, cqDetailReplacement);
  changes++;
  console.log('Applied CQDetailItem interface update');
}

// 4. Add uddeepokImage to CQListItem
const cqListItemInsert = '  uddeepok: string' + eol + '  questionCount: number';
const cqListItemReplacement = '  uddeepok: string' + eol + '  uddeepokImage?: string | null' + eol + '  questionCount: number';
if (content.includes(cqListItemInsert)) {
  content = content.replace(cqListItemInsert, cqListItemReplacement);
  changes++;
  console.log('Applied CQListItem interface update');
}

// 5. questionImage render in renderKnowledgeQuestions (after question text)
const knwQImgEnd = '<RichContentRenderer content={q1.text} className="inline" inline />' + eol + '        </div>';
const knwQImgReplacement = '<RichContentRenderer content={q1.text} className="inline" inline />' + eol + '        {q1.questionImage && (' + eol + '          <SafeImage src={q1.questionImage} alt="\\u09aa\\u09cd\\u09b0\\u09b6\\u09cd\\u09a8 \\u099a\\u09bf\\u09a4\\u09cd\\u09b0" className="mt-2 max-w-full rounded-lg border max-h-40" />' + eol + '        )}' + eol + '        </div>';
if (content.includes(knwQImgEnd)) {
  content = content.replace(knwQImgEnd, knwQImgReplacement);
  changes++;
  console.log('Applied questionImage in knowledge view');
}

// 6. answerImage render in renderKnowledgeQuestions (after answer text, unlocked)
const knwAImgEnd = '<RichContentRenderer content={q1.answer} className="inline" inline />' + eol + '            </div>';
const knwAImgReplacement = '<RichContentRenderer content={q1.answer} className="inline" inline />' + eol + '            {q1.answerImage && (' + eol + '              <SafeImage src={q1.answerImage} alt="\\u0989\\u09a4\\u09cd\\u09a4\\u09b0 \\u099a\\u09bf\\u09a4\\u09cd\\u09b0" className="mt-2 max-w-full rounded-lg border max-h-48" />' + eol + '            )}' + eol + '            </div>';
if (content.includes(knwAImgEnd)) {
  content = content.replace(knwAImgEnd, knwAImgReplacement);
  changes++;
  console.log('Applied answerImage in knowledge view');
}

// 7. questionImage render in renderUnderstandingQuestions (after q2 text)
const undQImgEnd = '<RichContentRenderer content={q2.text} className="inline" inline />' + eol + '          </div>';
const undQImgReplacement = '<RichContentRenderer content={q2.text} className="inline" inline />' + eol + '          {q2.questionImage && (' + eol + '            <SafeImage src={q2.questionImage} alt="\\u09aa\\u09cd\\u09b0\\u09b6\\u09cd\\u09a8 \\u099a\\u09bf\\u09a4\\u09cd\\u09b0" className="mt-2 max-w-full rounded-lg border max-h-40" />' + eol + '          )}' + eol + '          </div>';
if (content.includes(undQImgEnd)) {
  content = content.replace(undQImgEnd, undQImgReplacement);
  changes++;
  console.log('Applied questionImage in understanding view');
}

// 8. answerImage render in renderUnderstandingQuestions (after q2 answer, unlocked)
const undAImgEnd = '<RichContentRenderer content={q2.answer} className="inline" inline />' + eol + '              </div>';
const undAImgReplacement = '<RichContentRenderer content={q2.answer} className="inline" inline />' + eol + '              {q2.answerImage && (' + eol + '                <SafeImage src={q2.answerImage} alt="\\u0989\\u09a4\\u09cd\\u09a4\\u09b0 \\u099a\\u09bf\\u09a4\\u09cd\\u09b0" className="mt-2 max-w-full rounded-lg border max-h-48" />' + eol + '              )}' + eol + '              </div>';
if (content.includes(undAImgEnd)) {
  content = content.replace(undAImgEnd, undAImgReplacement);
  changes++;
  console.log('Applied answerImage in understanding view');
}

// 9. uddeepokImage in CQ list cards (the "\\u09b8\\u09c3\\u099c\\u09a8\\u09b6\\u09c0\\u09b2 \\u09aa\\u09cd\\u09b0\\u09b6\\u09cd\\u09a8" tab)
// Multiple patterns to match all three card types (free, purchased, locked)
// Each has 'line-clamp-2' uddeepok rendering
const listUddeepokPattern = 'line-clamp-2\"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + \'...\' : cq.uddeepok} inline /></div>' + eol + '                                    <div className=\"flex items-center gap-2 mt-0.5';
const listUddeepokReplacement = 'line-clamp-2\"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + \'...\' : cq.uddeepok} inline /></div>' + eol + '                                    {cq.uddeepokImage && (' + eol + '                                      <SafeImage src={cq.uddeepokImage} alt=\\"\\u0989\\u09a6\\u09cd\\u09a6\\u09c0\\u09aa\\u0995 \\u099a\\u09bf\\u09a4\\u09cd\\u09b0\\" className=\\"mt-1 max-w-full rounded-lg border max-h-24\\" />' + eol + '                                    )}' + eol + '                                    <div className=\"flex items-center gap-2 mt-0.5';

// Count occurrences and replace all
let count = 0;
while (content.includes(listUddeepokPattern)) {
  content = content.replace(listUddeepokPattern, listUddeepokReplacement);
  count++;
}
if (count > 0) {
  changes++;
  console.log('Applied uddeepokImage in ' + count + ' CQ list card patterns');
}

console.log('Total changes:', changes);
console.log('SafeImage:', (content.match(/SafeImage/g) || []).length);
console.log('uddeepokImage:', (content.match(/uddeepokImage/g) || []).length);
console.log('questionImage:', (content.match(/questionImage/g) || []).length);
console.log('answerImage:', (content.match(/answerImage/g) || []).length);

if (changes > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Written successfully');
} else {
  console.log('No changes to write');
}
