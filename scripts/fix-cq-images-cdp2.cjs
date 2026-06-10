const fs = require('fs');
const path = require('path');
const eol = '\r\n';

const filePath = path.resolve('src/components/classes/ChapterDetailPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Bengali text constants
const UDDIPOK_CHITRO = 'উদ্দীপক চিত্র';
const UTTOR = 'উত্তর';
const PROSHNO_CHITRO = 'প্রশ্ন চিত্র';
const UTTOR_CHITRO = 'উত্তর চিত্র';

// 1. Add SafeImage import
const importTarget = "import RichContentRenderer from '@/components/ui/rich-content-renderer'";
if (content.includes(importTarget) && !content.includes('SafeImage')) {
  content = content.replace(importTarget, "import SafeImage from '@/components/ui/safe-image'" + eol + "import RichContentRenderer from '@/components/ui/rich-content-renderer'");
  changes++;
  console.log('✓ SafeImage import');
}

// 2. Add questionImage/answerImage to CQQuestion
const cqQuestionEnd = '  answer: string' + eol + '}';
const cqQuestionReplacement = '  answer: string' + eol + '  questionImage?: string | null' + eol + '  answerImage?: string | null' + eol + '}';
if (content.includes(cqQuestionEnd)) {
  content = content.replace(cqQuestionEnd, cqQuestionReplacement);
  changes++;
  console.log('✓ CQQuestion interface');
}

// 3. Add uddeepokImage to CQDetailItem
const cqDetailTarget = '  uddeepok: string' + eol + '  questions: CQQuestion[]';
const cqDetailReplacement = '  uddeepok: string' + eol + '  uddeepokImage?: string | null' + eol + '  questions: CQQuestion[]';
if (content.includes(cqDetailTarget)) {
  content = content.replace(cqDetailTarget, cqDetailReplacement);
  changes++;
  console.log('✓ CQDetailItem interface');
}

// 4. Add uddeepokImage to CQListItem
const cqListItemTarget = '  uddeepok: string' + eol + '  questionCount: number';
const cqListItemReplacement = '  uddeepok: string' + eol + '  uddeepokImage?: string | null' + eol + '  questionCount: number';
if (content.includes(cqListItemTarget)) {
  content = content.replace(cqListItemTarget, cqListItemReplacement);
  changes++;
  console.log('✓ CQListItem interface');
}

// 5. Knowledge: questionImage after q1 text
const knwQTarget = '<RichContentRenderer content={q1.text} className="inline" inline />' + eol + '        </div>';
const knwQReplacement = '<RichContentRenderer content={q1.text} className="inline" inline />' + eol + '        {q1.questionImage && (' + eol + '          <SafeImage src={q1.questionImage} alt="' + PROSHNO_CHITRO + '" className="mt-2 max-w-full rounded-lg border max-h-40" />' + eol + '        )}' + eol + '        </div>';
if (content.includes(knwQTarget)) {
  content = content.replace(knwQTarget, knwQReplacement);
  changes++;
  console.log('✓ questionImage in knowledge view');
}

// 6. Knowledge: answerImage after q1 answer (unlocked)
const knwATarget = '<RichContentRenderer content={q1.answer} className="inline" inline />' + eol + '            </div>';
const knwAReplacement = '<RichContentRenderer content={q1.answer} className="inline" inline />' + eol + '            {q1.answerImage && (' + eol + '              <SafeImage src={q1.answerImage} alt="' + UTTOR_CHITRO + '" className="mt-2 max-w-full rounded-lg border max-h-48" />' + eol + '            )}' + eol + '            </div>';
if (content.includes(knwATarget)) {
  content = content.replace(knwATarget, knwAReplacement);
  changes++;
  console.log('✓ answerImage in knowledge view');
}

// 7. Understanding: questionImage after q2 text
const undQTarget = '<RichContentRenderer content={q2.text} className="inline" inline />' + eol + '          </div>';
const undQReplacement = '<RichContentRenderer content={q2.text} className="inline" inline />' + eol + '          {q2.questionImage && (' + eol + '            <SafeImage src={q2.questionImage} alt="' + PROSHNO_CHITRO + '" className="mt-2 max-w-full rounded-lg border max-h-40" />' + eol + '          )}' + eol + '          </div>';
if (content.includes(undQTarget)) {
  content = content.replace(undQTarget, undQReplacement);
  changes++;
  console.log('✓ questionImage in understanding view');
}

// 8. Understanding: answerImage after q2 answer (unlocked)
const undATarget = '<RichContentRenderer content={q2.answer} className="inline" inline />' + eol + '              </div>';
const undAReplacement = '<RichContentRenderer content={q2.answer} className="inline" inline />' + eol + '              {q2.answerImage && (' + eol + '                <SafeImage src={q2.answerImage} alt="' + UTTOR_CHITRO + '" className="mt-2 max-w-full rounded-lg border max-h-48" />' + eol + '              )}' + eol + '              </div>';
if (content.includes(undATarget)) {
  content = content.replace(undATarget, undAReplacement);
  changes++;
  console.log('✓ answerImage in understanding view');
}

// 9. uddeepokImage in CQ list cards (3x: free, purchased, locked)
const listUddeepokTarget = 'line-clamp-2"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + \'...\' : cq.uddeepok} inline /></div>' + eol + '                                    <div className="flex items-center gap-2 mt-0.5';
const listUddeepokReplacement = 'line-clamp-2"><RichContentRenderer content={cq.uddeepok.length > 100 ? cq.uddeepok.slice(0, 100) + \'...\' : cq.uddeepok} inline /></div>' + eol + '                                    {cq.uddeepokImage && (' + eol + '                                      <SafeImage src={cq.uddeepokImage} alt="' + UDDIPOK_CHITRO + '" className="mt-1 max-w-full rounded-lg border max-h-24" />' + eol + '                                    )}' + eol + '                                    <div className="flex items-center gap-2 mt-0.5';

let listCount = 0;
while (content.includes(listUddeepokTarget)) {
  content = content.replace(listUddeepokTarget, listUddeepokReplacement);
  listCount++;
}
if (listCount > 0) {
  changes++;
  console.log('✓ uddeepokImage in ' + listCount + ' CQ list cards');
}

console.log('Total changes: ' + changes);
console.log('SafeImage refs: ' + (content.match(/SafeImage/g) || []).length);
console.log('uddeepokImage refs: ' + (content.match(/uddeepokImage/g) || []).length);

if (changes > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ File written');
}
