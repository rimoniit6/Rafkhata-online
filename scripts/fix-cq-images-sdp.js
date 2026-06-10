const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'classes', 'SubjectDetailPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// 1. Add SafeImage import
const importPattern = "import RichContentRenderer from '@/components/ui/rich-content-renderer'";
if (content.includes(importPattern) && !content.includes('SafeImage')) {
  content = content.replace(
    importPattern,
    "import SafeImage from '@/components/ui/safe-image'\nimport RichContentRenderer from '@/components/ui/rich-content-renderer'"
  );
  changes++;
  console.log('✓ Added SafeImage import');
}

// 2. Add questionImage, answerImage to CQQuestion interface
const cqQuestionPattern = `interface CQQuestion {
  id: string
  label: string
  number: number
  text: string
  marks: number
  answer: string
}`;

const cqQuestionReplacement = `interface CQQuestion {
  id: string
  label: string
  number: number
  text: string
  marks: number
  answer: string
  questionImage?: string | null
  answerImage?: string | null
}`;

if (content.includes(cqQuestionPattern)) {
  content = content.replace(cqQuestionPattern, cqQuestionReplacement);
  changes++;
  console.log('✓ Added questionImage/answerImage to CQQuestion');
}

// 3. Add uddeepokImage to CQDetailItem interface  
const cqDetailPattern = `interface CQDetailItem {
  id: string
  uddeepok: string
  questions: CQQuestion[]`;

const cqDetailReplacement = `interface CQDetailItem {
  id: string
  uddeepok: string
  uddeepokImage?: string | null
  questions: CQQuestion[]`;

if (content.includes(cqDetailPattern)) {
  content = content.replace(cqDetailPattern, cqDetailReplacement);
  changes++;
  console.log('✓ Added uddeepokImage to CQDetailItem');
}

// 4. Add uddeepokImage rendering after uddeepok text in renderCQFullContent
// The uddeepok block in renderCQFullContent
const uddeepokRenderPattern = `            {cq.uddeepok && (
              <div className="mb-3 p-2 rounded-lg bg-muted/50 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">উদ্দীপক</p>
                <RichContentRenderer content={cq.uddeepok} className="text-sm leading-relaxed" />
              </div>
            )}`;

const uddeepokRenderReplacement = `            {cq.uddeepok && (
              <div className="mb-3 p-2 rounded-lg bg-muted/50 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">উদ্দীপক</p>
                <RichContentRenderer content={cq.uddeepok} className="text-sm leading-relaxed" />
              </div>
            )}
            {cq.uddeepokImage && (
              <SafeImage src={cq.uddeepokImage} alt="উদ্দীপক চিত্র" className="mt-2 max-w-full rounded-lg border max-h-64" />
            )}`;

if (content.includes(uddeepokRenderPattern)) {
  content = content.replace(uddeepokRenderPattern, uddeepokRenderReplacement);
  changes++;
  console.log('✓ Added uddeepokImage rendering after uddeepok text');
}

// 5. Add questionImage + answerImage rendering inside the question loop in renderCQFullContent
// The question rendering block inside renderCQFullContent (the one with RichContentRenderer for question and answer)
const questionLoopRenderPattern = `                    <div className="flex-1 min-w-0">
                      <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                    </div>
                    {question.marks > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                    )}
                  </div>
                  {/* Answer */}
                  {!isLocked && question.answer && (
                    <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                      <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                    </div>
                  )}`;

const questionLoopRenderReplacement = `                    <div className="flex-1 min-w-0">
                      <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                      {question.questionImage && (
                        <SafeImage src={question.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                      )}
                    </div>
                    {question.marks > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                    )}
                  </div>
                  {/* Answer */}
                  {!isLocked && question.answer && (
                    <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                      <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                      {question.answerImage && (
                        <SafeImage src={question.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
                      )}
                    </div>
                  )}`;

if (content.includes(questionLoopRenderPattern)) {
  content = content.replace(questionLoopRenderPattern, questionLoopRenderReplacement);
  changes++;
  console.log('✓ Added questionImage/answerImage rendering in full content');
}

// 6. Add questionImage + answerImage rendering in renderCQCard (knowledge/understanding mode)
// The question rendering in renderCQCard - look for a slightly different pattern
const cqCardQuestionPattern = `                  <div className="flex-1 min-w-0">
                    <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                  </div>
                  {question.marks > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                  )}
                </div>
                {/* Answer */}
                {!isLocked && question.answer && (
                  <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                    <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                  </div>
                )}`;

const cqCardQuestionReplacement = `                  <div className="flex-1 min-w-0">
                    <RichContentRenderer content={question.text} className="text-sm leading-relaxed" />
                    {question.questionImage && (
                      <SafeImage src={question.questionImage} alt="প্রশ্ন চিত্র" className="mt-2 max-w-full rounded-lg border max-h-40" />
                    )}
                  </div>
                  {question.marks > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">{toBengaliNum(question.marks)} নম্বর</Badge>
                  )}
                </div>
                {/* Answer */}
                {!isLocked && question.answer && (
                  <div className="ml-8 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 inline-block mr-2">উত্তর:</p>
                    <RichContentRenderer content={question.answer} className="text-sm leading-relaxed inline" />
                    {question.answerImage && (
                      <SafeImage src={question.answerImage} alt="উত্তর চিত্র" className="mt-2 max-w-full rounded-lg border max-h-48" />
                    )}
                  </div>
                )}`;

if (content.includes(cqCardQuestionPattern)) {
  content = content.replace(cqCardQuestionPattern, cqCardQuestionReplacement);
  changes++;
  console.log('✓ Added questionImage/answerImage rendering in CQ card');
}

if (changes > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n✅ ${changes} changes applied to SubjectDetailPage.tsx`);
} else {
  console.log('\n⚠️ No changes applied - patterns may have changed');
}

// Print counts for verification
const counts = {
  SafeImage: (content.match(/SafeImage/g) || []).length,
  uddeepokImage: (content.match(/uddeepokImage/g) || []).length,
  questionImage: (content.match(/questionImage/g) || []).length,
  answerImage: (content.match(/answerImage/g) || []).length,
};
console.log('Reference counts:', JSON.stringify(counts));
