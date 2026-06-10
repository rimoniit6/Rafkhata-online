-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "avatar" TEXT,
    "phone" TEXT,
    "institute" TEXT,
    "classLevel" TEXT,
    "board" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "gradient" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecture" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "pdfUrl" TEXT,
    "thumbnail" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionImage" TEXT,
    "optionA" TEXT NOT NULL,
    "optionAImage" TEXT,
    "optionB" TEXT NOT NULL,
    "optionBImage" TEXT,
    "optionC" TEXT NOT NULL,
    "optionCImage" TEXT,
    "optionD" TEXT NOT NULL,
    "optionDImage" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "explanationImage" TEXT,
    "chapterId" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "board" TEXT,
    "year" TEXT,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MCQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQ" (
    "id" TEXT NOT NULL,
    "uddeepok" TEXT NOT NULL,
    "uddeepokImage" TEXT,
    "question1" TEXT NOT NULL,
    "question1Image" TEXT,
    "question2" TEXT NOT NULL,
    "question2Image" TEXT,
    "question3" TEXT NOT NULL,
    "question3Image" TEXT,
    "question4" TEXT NOT NULL,
    "question4Image" TEXT,
    "answer1" TEXT NOT NULL,
    "answer1Image" TEXT,
    "answer2" TEXT NOT NULL,
    "answer2Image" TEXT,
    "answer3" TEXT NOT NULL,
    "answer3Image" TEXT,
    "answer4" TEXT NOT NULL,
    "answer4Image" TEXT,
    "chapterId" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "board" TEXT,
    "year" TEXT,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classLevel" TEXT NOT NULL,
    "subjectId" TEXT,
    "chapterIds" TEXT,
    "type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "marksPerMcq" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "instructions" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "answers" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackMessage" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentlyViewed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentlyViewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "screenshot" TEXT,
    "contentType" TEXT,
    "contentId" TEXT,
    "contentTitle" TEXT,
    "classLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT,
    "link" TEXT,
    "buttonText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "avatar" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "pdfUrl" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "thumbnail" TEXT,
    "classLevel" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "thumbnail" TEXT,
    "pdfUrl" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'rose',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamYear" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardYear" (
    "id" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelBn" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "lightColor" TEXT,
    "textColor" TEXT,
    "route" TEXT,
    "paramKey" TEXT,
    "buttonLabel" TEXT,
    "showInChapterDetail" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedContent" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "thumbnail" TEXT,
    "section" TEXT NOT NULL DEFAULT 'homepage',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Navigation" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'BookOpen',
    "location" TEXT NOT NULL DEFAULT 'header',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isAuthOnly" BOOLEAN NOT NULL DEFAULT false,
    "isAdminOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBundle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "classLevel" TEXT,
    "board" TEXT,
    "year" TEXT,
    "type" TEXT NOT NULL DEFAULT 'mixed',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPackage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationLabel" TEXT NOT NULL DEFAULT 'αº⌐αºª αªªαª┐αª¿',
    "classLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "classLevel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamPackage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT NOT NULL,
    "subjectIds" TEXT NOT NULL DEFAULT '[]',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail" TEXT,
    "totalSets" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MCQExamPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamSet" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '00:00',
    "endTime" TEXT NOT NULL DEFAULT '23:59',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "marksPerQ" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "allowRetake" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MCQExamSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamSetQuestion" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "mcqId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MCQExamSetQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamSetResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalWrong" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "marksObtained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "canRetake" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MCQExamSetResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamRetakeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MCQExamRetakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCQExamPackagePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MCQExamPackagePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamPackage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT NOT NULL,
    "subjectIds" TEXT NOT NULL DEFAULT '[]',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT true,
    "thumbnail" TEXT,
    "totalSets" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamSet" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '00:00',
    "endTime" TEXT NOT NULL DEFAULT '23:59',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "marksPerQ" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "allowRetake" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "answerMode" TEXT NOT NULL DEFAULT 'flexible',
    "showAnnotatedImages" BOOLEAN NOT NULL DEFAULT true,
    "autoPublishResults" BOOLEAN NOT NULL DEFAULT false,
    "maxImagesPerAnswer" INTEGER NOT NULL DEFAULT 5,
    "gradingDeadline" TIMESTAMP(3),
    "passMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "showCorrectAnswers" BOOLEAN NOT NULL DEFAULT false,
    "enablePartialGrading" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamSetQuestion" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "cqId" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'cq',
    "subMarks" TEXT,
    "typedUddeepok" TEXT,
    "typedUddeepokImage" TEXT,
    "typedQuestion1" TEXT,
    "typedQuestion1Image" TEXT,
    "typedQuestion2" TEXT,
    "typedQuestion2Image" TEXT,
    "typedQuestion3" TEXT,
    "typedQuestion3Image" TEXT,
    "typedQuestion4" TEXT,
    "typedQuestion4Image" TEXT,

    CONSTRAINT "CQExamSetQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamPackagePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "paymentId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CQExamPackagePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "obtainedMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "canRetake" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "subIndex" INTEGER NOT NULL DEFAULT 0,
    "answerText" TEXT,
    "obtainedMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamAnswerImage" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "annotations" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamAnswerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQExamRetakeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQExamRetakeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherModerator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherModerator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_supabaseUserId_idx" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClassCategory_slug_key" ON "ClassCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_classId_key" ON "Subject"("slug", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_subjectId_key" ON "Chapter"("slug", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_chapterId_key" ON "Topic"("slug", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_questionType_questionId_key" ON "ExamQuestion"("examId", "questionType", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_contentId_contentType_key" ON "Progress"("userId", "contentId", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_contentType_key" ON "Bookmark"("userId", "contentId", "contentType");

-- CreateIndex
CREATE INDEX "UserFeedback_userId_idx" ON "UserFeedback"("userId");

-- CreateIndex
CREATE INDEX "UserFeedback_status_idx" ON "UserFeedback"("status");

-- CreateIndex
CREATE INDEX "FeedbackMessage_feedbackId_idx" ON "FeedbackMessage"("feedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "Board_slug_key" ON "Board"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExamYear_year_key" ON "ExamYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BoardYear_board_year_key" ON "BoardYear"("board", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_key_key" ON "ContentType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedContent_section_contentType_contentId_key" ON "FeaturedContent"("section", "contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBundle_slug_key" ON "ContentBundle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BundleItem_bundleId_contentType_contentId_key" ON "BundleItem"("bundleId", "contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPackage_slug_key" ON "ContentPackage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_packageId_classLevel_key" ON "UserSubscription"("userId", "packageId", "classLevel");

-- CreateIndex
CREATE UNIQUE INDEX "MCQExamSetQuestion_setId_mcqId_key" ON "MCQExamSetQuestion"("setId", "mcqId");

-- CreateIndex
CREATE UNIQUE INDEX "MCQExamSetResult_userId_setId_key" ON "MCQExamSetResult"("userId", "setId");

-- CreateIndex
CREATE UNIQUE INDEX "MCQExamRetakeRequest_userId_setId_key" ON "MCQExamRetakeRequest"("userId", "setId");

-- CreateIndex
CREATE UNIQUE INDEX "MCQExamPackagePurchase_userId_packageId_key" ON "MCQExamPackagePurchase"("userId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "CQExamSetQuestion_setId_cqId_key" ON "CQExamSetQuestion"("setId", "cqId");

-- CreateIndex
CREATE UNIQUE INDEX "CQExamPackagePurchase_userId_packageId_key" ON "CQExamPackagePurchase"("userId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "CQExamSubmission_userId_setId_key" ON "CQExamSubmission"("userId", "setId");

-- CreateIndex
CREATE UNIQUE INDEX "CQExamAnswer_submissionId_questionId_subIndex_key" ON "CQExamAnswer"("submissionId", "questionId", "subIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CQExamRetakeRequest_userId_setId_key" ON "CQExamRetakeRequest"("userId", "setId");

