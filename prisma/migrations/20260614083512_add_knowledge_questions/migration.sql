-- CreateTable
CREATE TABLE "KnowledgeQuestion" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionImage" TEXT,
    "answerImage" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeQuestion_chapterId_type_isActive_idx" ON "KnowledgeQuestion"("chapterId", "type", "isActive");

-- CreateIndex
CREATE INDEX "KnowledgeQuestion_isPremium_isActive_idx" ON "KnowledgeQuestion"("isPremium", "isActive");
