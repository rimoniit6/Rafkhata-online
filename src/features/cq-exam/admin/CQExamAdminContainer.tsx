'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useCQExamPackages } from './hooks/use-cq-exam-packages'

// Sub-components
import { CQPackageList } from './components/CQPackageList'
import { CQPackageForm } from './components/CQPackageForm'
import { CQPackageDetail } from './components/CQPackageDetail'
import { CQExamSetForm } from './components/CQExamSetForm'
import { CQQuestionManager } from './components/CQQuestionManager'
import { CQQuestionCreatePage } from './components/CQQuestionCreatePage'
import { CQSubmissions } from './components/CQSubmissions'
import { CQGradingInterface } from './components/CQGradingInterface'
import { CQRetakeRequests } from './components/CQRetakeRequests'
import { CQBulkGradingView } from './components/CQBulkGradingView'
import { CQBulkCreateSetsDialog } from './components/CQBulkCreateSetsDialog'
import { CQQuestionSearchDialog } from './components/CQQuestionSearchDialog'
import { CQLeaderboard } from './components/CQLeaderboard'

export default function AdminCQExamPackagesPage() {
  const { classLevelLabels } = useHierarchyMetadata()
  const {
    viewMode, setViewMode,
    editId, setEditId,
    selectedPackageId, setSelectedPackageId,
    selectedSetId, setSelectedSetId,
    deleteTarget, setDeleteTarget,
    loading, saving,
    packages, total,
    currentPackage, setCurrentPackage,
    examSets, currentSet, setCurrentSet,
    submissions,
    classes, subjects, setSubjects,
    search, setSearch,
    filterClassId, setFilterClassId,
    filterStatus, setFilterStatus,
    pkgTitle, setPkgTitle,
    pkgDescription, setPkgDescription,
    pkgClassId, setPkgClassId,
    pkgSubjectIds, setPkgSubjectIds,
    pkgPrice, setPkgPrice,
    pkgOriginalPrice, setPkgOriginalPrice,
    pkgThumbnail, setPkgThumbnail,
    pkgIsPremium, setPkgIsPremium,
    pkgIsActive, setPkgIsActive,
    pkgOrder, setPkgOrder,
    pkgStatus, setPkgStatus,
    setTitle, setSetTitle,
    setDescription, setSetDescription,
    setScheduledDate, setSetScheduledDate,
    setStartTime, setSetStartTime,
    setEndTime, setSetEndTime,
    setDuration, setSetDuration,
    setMarksPerQ, setSetMarksPerQ,
    setInstructions, setSetInstructions,
    setOrder, setSetOrder,
    setStatus, setSetStatus,
    setAllowRetake, setSetAllowRetake,
    setAnswerMode, setSetAnswerMode,
    setShowAnnotatedImages, setSetShowAnnotatedImages,
    setAutoPublishResults, setSetAutoPublishResults,
    setMaxImagesPerAnswer, setSetMaxImagesPerAnswer,
    setGradingDeadline, setSetGradingDeadline,
    setPassMarks, setSetPassMarks,
    setShowCorrectAnswers, setSetShowCorrectAnswers,
    setEnablePartialGrading, setSetEnablePartialGrading,

    searchDialogOpen, setSearchDialogOpen,
    searchCqs, setSearchCqs, searchCqLoading,
    selectedCqIds, setSelectedCqIds,
    searchCqClassLevel, setSearchCqClassLevel,
    searchCqSubjectId, setSearchCqSubjectId,
    searchCqChapterId, setSearchCqChapterId,
    searchCqText, setSearchCqText,
    searchCqSubjects, searchCqChapters,
    submissionDetailOpen, setSubmissionDetailOpen,
    selectedSubmission, setSelectedSubmission,
    bulkCreateDialogOpen, setBulkCreateDialogOpen,
    bulkPrefix, setBulkPrefix,
    bulkStartDate, setBulkStartDate,
    bulkIntervalDays, setBulkIntervalDays,
    bulkCount, setBulkCount,
    bulkDuration, setBulkDuration,
    bulkMarksPerQ, setBulkMarksPerQ,
    retakeRequests, retakeRequestsLoading,
    leaderboardData, leaderboardSetTitle, leaderboardLoading,
    bulkSubmissions, bulkGradingLoading,
    fetchPackages, fetchPackageDetail, fetchSetDetail, fetchSubmissions,
    fetchSubjectsForClass, fetchSearchCqSubjects, fetchSearchCqChapters,
    handleSavePackage, handleSaveSet, handleDelete,
    handleBulkCreateSets, handleSearchCqs, handleAddCqs,
    handleCreateTypedQuestion, handleRemoveQuestion, handleMoveQuestion,
    handleGradeSubmission, handleBulkGrade, handlePublishResults, handleAllowRetake,
    handleFetchBulkSubmissions, handleSaveBulkGrades,
    fetchRetakeRequests, handleApproveRetakeRequest,
    handleUpdateTypedQuestion, handleUpdateQuestionMarks,
    editQuestionData, setEditQuestionData,
    openLeaderboard, togglePackageActive
  } = useCQExamPackages()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <CQPackageList
              loading={loading} total={total} packages={packages} classes={classes}
              search={search} setSearch={setSearch} filterClassId={filterClassId} setFilterClassId={setFilterClassId}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              onOpenCreate={() => { setEditId(null); setViewMode('package-editor'); }}
              onOpenDetail={(pkg) => { setSelectedPackageId(pkg.id); setCurrentPackage(pkg); fetchPackageDetail(pkg.id); setViewMode('package-detail'); }}
              onToggleActive={togglePackageActive}
              onOpenEdit={(pkg) => {
                setEditId(pkg.id); setPkgTitle(pkg.title); setPkgDescription(pkg.description || '');
                setPkgClassId(pkg.classId); setPkgPrice(String(pkg.price)); setPkgOriginalPrice(String(pkg.originalPrice));
                setPkgThumbnail(pkg.thumbnail || ''); setPkgIsPremium(pkg.isPremium); setPkgIsActive(pkg.isActive);
                setPkgOrder(String(pkg.order));
                setPkgStatus(pkg.status); try { setPkgSubjectIds(JSON.parse(pkg.subjectIds || '[]')) } catch { setPkgSubjectIds([]) }
                fetchSubjectsForClass(pkg.classId); setViewMode('package-editor');
              }}
              onDelete={(id) => setDeleteTarget({ type: 'package', id })}
            />
          </motion.div>
        )}

        {viewMode === 'package-editor' && (
          <motion.div key="package-editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQPackageForm
              editId={editId} pkgTitle={pkgTitle} setPkgTitle={setPkgTitle} pkgDescription={pkgDescription} setPkgDescription={setPkgDescription}
              pkgThumbnail={pkgThumbnail} setPkgThumbnail={setPkgThumbnail} pkgClassId={pkgClassId} onClassChange={(id) => { setPkgClassId(id); setPkgSubjectIds([]); fetchSubjectsForClass(id) }}
              classes={classes} pkgSubjectIds={pkgSubjectIds} setPkgSubjectIds={setPkgSubjectIds} subjects={subjects}
              pkgPrice={pkgPrice} setPkgPrice={setPkgPrice} pkgOriginalPrice={pkgOriginalPrice} setPkgOriginalPrice={setPkgOriginalPrice}
              pkgIsPremium={pkgIsPremium} setPkgIsPremium={setPkgIsPremium}
              pkgIsActive={pkgIsActive} setPkgIsActive={setPkgIsActive} pkgOrder={pkgOrder} setPkgOrder={setPkgOrder}
              pkgStatus={pkgStatus} setPkgStatus={setPkgStatus} saving={saving} onSave={handleSavePackage} onCancel={() => setViewMode('list')}
            />
          </motion.div>
        )}

        {viewMode === 'package-detail' && (
          <motion.div key="package-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQPackageDetail
              loading={loading} currentPackage={currentPackage} examSets={examSets}
              onBack={() => setViewMode('list')}
              onEditPackage={(pkg) => {
                setEditId(pkg.id); setPkgTitle(pkg.title); setPkgDescription(pkg.description || '');
                setPkgClassId(pkg.classId); setPkgPrice(String(pkg.price)); setPkgOriginalPrice(String(pkg.originalPrice));
                setPkgThumbnail(pkg.thumbnail || ''); setPkgIsPremium(pkg.isPremium); setPkgIsActive(pkg.isActive);
                setPkgOrder(String(pkg.order));
                setPkgStatus(pkg.status); try { setPkgSubjectIds(JSON.parse(pkg.subjectIds || '[]')) } catch { setPkgSubjectIds([]) }
                fetchSubjectsForClass(pkg.classId); setViewMode('package-editor');
              }}
              onOpenBulkCreate={() => setBulkCreateDialogOpen(true)}
              onOpenCreateSet={() => {
                setEditId(null); setSetAllowRetake(false);
                setSetAnswerMode('flexible'); setSetShowAnnotatedImages(true);
                setSetAutoPublishResults(false); setSetMaxImagesPerAnswer('5');
                setSetGradingDeadline(''); setSetPassMarks('0');
                setSetShowCorrectAnswers(false); setSetEnablePartialGrading(true);
                setViewMode('set-editor');
              }}
              onOpenQuestionManager={(id) => { setSelectedSetId(id); fetchSetDetail(id); setViewMode('question-manager'); }}
              onOpenSubmissions={(id) => { setSelectedSetId(id); fetchSubmissions(id); setViewMode('submissions'); }}
              onOpenRetakeRequests={(id) => { setSelectedSetId(id); fetchRetakeRequests(id); setViewMode('retake-requests'); }}
              onOpenLeaderboard={openLeaderboard}
              onOpenEditSet={(set) => {
                setEditId(set.id); setSetTitle(set.title); setSetDescription(set.description || '');
                setSetScheduledDate(set.scheduledDate ? new Date(set.scheduledDate).toISOString().split('T')[0] : '');
                setSetStartTime(set.startTime || '00:00'); setSetEndTime(set.endTime || '23:59');
                setSetDuration(String(set.duration)); setSetMarksPerQ(String(set.marksPerQ));
                setSetInstructions(set.instructions || ''); setSetOrder(String(set.order)); setSetStatus(set.status);
                setSetAllowRetake(set.allowRetake);
                setSetAnswerMode(set.answerMode || 'flexible');
                setSetShowAnnotatedImages(set.showAnnotatedImages ?? true);
                setSetAutoPublishResults(set.autoPublishResults ?? false);
                setSetMaxImagesPerAnswer(String(set.maxImagesPerAnswer ?? 5));
                setSetGradingDeadline(set.gradingDeadline ? new Date(set.gradingDeadline).toISOString().slice(0, 16) : '');
                setSetPassMarks(String(set.passMarks ?? 0));
                setSetShowCorrectAnswers(set.showCorrectAnswers ?? false);
                setSetEnablePartialGrading(set.enablePartialGrading ?? true);
                setViewMode('set-editor');
              }}
              onDeleteSet={(id) => setDeleteTarget({ type: 'set', id, packageId: selectedPackageId! })}
            />
          </motion.div>
        )}

        {viewMode === 'set-editor' && (
          <motion.div key="set-editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQExamSetForm
              editId={editId} currentSet={currentSet} setTitle={setTitle} setSetTitle={setSetTitle} setDescription={setDescription} setSetDescription={setSetDescription}
              setScheduledDate={setScheduledDate} setSetScheduledDate={setSetScheduledDate} setStartTime={setStartTime} setSetStartTime={setSetStartTime}
              setEndTime={setEndTime} setSetEndTime={setSetEndTime} setDuration={setDuration} setSetDuration={setSetDuration} setMarksPerQ={setMarksPerQ}
              setSetMarksPerQ={setSetMarksPerQ} setInstructions={setInstructions}
              setSetInstructions={setSetInstructions} setOrder={setOrder} setSetOrder={setSetOrder} setStatus={setStatus} setSetStatus={setSetStatus}
              setAllowRetake={setAllowRetake} setSetAllowRetake={setSetAllowRetake}
              setAnswerMode={setAnswerMode} setSetAnswerMode={setSetAnswerMode}
              setShowAnnotatedImages={setShowAnnotatedImages} setSetShowAnnotatedImages={setSetShowAnnotatedImages}
              setAutoPublishResults={setAutoPublishResults} setSetAutoPublishResults={setSetAutoPublishResults}
              setMaxImagesPerAnswer={setMaxImagesPerAnswer} setSetMaxImagesPerAnswer={setSetMaxImagesPerAnswer}
              setGradingDeadline={setGradingDeadline} setSetGradingDeadline={setSetGradingDeadline}
              setPassMarks={setPassMarks} setSetPassMarks={setSetPassMarks}
              setShowCorrectAnswers={setShowCorrectAnswers} setSetShowCorrectAnswers={setSetShowCorrectAnswers}
              setEnablePartialGrading={setEnablePartialGrading} setSetEnablePartialGrading={setSetEnablePartialGrading}
              saving={saving} onSave={handleSaveSet} onCancel={() => setViewMode('package-detail')}
            />
          </motion.div>
        )}

        {viewMode === 'question-manager' && (
          <motion.div key="question-manager" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQQuestionManager
              loading={loading} currentSet={currentSet} onBack={() => setViewMode('package-detail')}
              onOpenAddQuestion={() => {
                setSelectedCqIds([]); setSearchCqClassLevel(currentPackage?.class?.slug || '');
                setSearchCqSubjectId(''); setSearchCqChapterId(''); setSearchCqText(''); setSearchCqs([])
                setSearchDialogOpen(true); if (currentPackage?.class?.slug) fetchSearchCqSubjects(currentPackage.class.slug);
              }}
              onOpenCreateQuestion={() => { setEditQuestionData(null); setViewMode('create-question'); }}
              onEditQuestion={(q) => {
                const typedData = {
                  id: q.id,
                  typedUddeepok: q.typedUddeepok || '',
                  typedUddeepokImage: q.typedUddeepokImage || '',
                  typedQuestion1: q.typedQuestion1 || '',
                  typedQuestion1Image: q.typedQuestion1Image || '',
                  typedQuestion2: q.typedQuestion2 || '',
                  typedQuestion2Image: q.typedQuestion2Image || '',
                  typedQuestion3: q.typedQuestion3 || '',
                  typedQuestion3Image: q.typedQuestion3Image || '',
                  typedQuestion4: q.typedQuestion4 || '',
                  typedQuestion4Image: q.typedQuestion4Image || '',
                  subMarks: (() => {
                    if (!q.subMarks) return [1, 2, 3, 4]
                    try { const p = JSON.parse(q.subMarks); return Array.isArray(p) ? p : [1, 2, 3, 4] } catch { return [1, 2, 3, 4] }
                  })(),
                }
                setEditQuestionData(typedData)
                setViewMode('create-question')
              }}
              onRemoveQuestion={handleRemoveQuestion}
              onMoveQuestion={handleMoveQuestion}
              onUpdateQuestionMarks={handleUpdateQuestionMarks}
            />
          </motion.div>
        )}

        {viewMode === 'create-question' && (
          <motion.div key={`cq-question-editor-${editQuestionData?.id || 'new'}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQQuestionCreatePage
              onBack={() => { setEditQuestionData(null); setViewMode('question-manager'); }}
              saving={saving}
              editData={editQuestionData}
              onCreateQuestion={async (data) => {
                try {
                  await handleCreateTypedQuestion(data)
                  setEditQuestionData(null)
                  setViewMode('question-manager')
                } catch {
                  // stay on create page
                }
              }}
              onUpdateQuestion={async (data) => {
                const ok = await handleUpdateTypedQuestion(data)
                if (ok) {
                  setEditQuestionData(null)
                  setViewMode('question-manager')
                }
              }}
            />
          </motion.div>
        )}

        {viewMode === 'submissions' && (
          <motion.div key="submissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQSubmissions
              loading={loading} currentSet={currentSet} submissions={submissions} onBack={() => setViewMode('package-detail')}
              selectedSubmission={selectedSubmission} setSelectedSubmission={setSelectedSubmission}
              detailOpen={submissionDetailOpen} setDetailOpen={setSubmissionDetailOpen}
              classLevelLabels={classLevelLabels}
              onStartGrading={(submission) => {
                setSelectedSubmission(submission);
                if (selectedSetId) fetchSetDetail(selectedSetId);
                setViewMode('grading');
              }}
              onPublishResults={(setId) => { handlePublishResults(setId); fetchSubmissions(setId); }}
              onBulkGrade={(setId, marks) => { handleBulkGrade(setId, marks); }}
              onOpenBulkGrading={() => { if (currentSet) { setViewMode('bulk-grading'); } }}
              onAllowRetake={handleAllowRetake}
              saving={saving}
            />
          </motion.div>
        )}

        {viewMode === 'grading' && (
          <motion.div key="grading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQGradingInterface
              submission={selectedSubmission} set={currentSet} saving={saving} onGrade={handleGradeSubmission}
              onBack={() => { setViewMode('submissions'); if (selectedSetId) fetchSubmissions(selectedSetId); }}
            />
          </motion.div>
        )}

        {viewMode === 'bulk-grading' && (
          <motion.div key="bulk-grading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQBulkGradingView
              saving={saving}
              set={currentSet}
              bulkSubmissions={bulkSubmissions}
              onBulkFetch={handleFetchBulkSubmissions}
              onSaveBulk={handleSaveBulkGrades}
              onBack={() => { setViewMode('submissions'); if (selectedSetId) fetchSubmissions(selectedSetId); }}
            />
          </motion.div>
        )}

        {viewMode === 'retake-requests' && (
          <motion.div key="retake-requests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQRetakeRequests
              loading={retakeRequestsLoading} requests={retakeRequests}
              currentSet={currentSet} saving={saving}
              onBack={() => setViewMode('package-detail')}
              onRefresh={(id) => fetchRetakeRequests(id)}
              onApprove={handleApproveRetakeRequest}
            />
          </motion.div>
        )}

        {viewMode === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <CQLeaderboard
              loading={leaderboardLoading} title={leaderboardSetTitle} data={leaderboardData} onBack={() => setViewMode('package-detail')}
              classLevelLabels={classLevelLabels}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <CQBulkCreateSetsDialog
        open={bulkCreateDialogOpen} onOpenChange={setBulkCreateDialogOpen}
        bulkPrefix={bulkPrefix} setBulkPrefix={setBulkPrefix} bulkStartDate={bulkStartDate} setBulkStartDate={setBulkStartDate}
        bulkIntervalDays={bulkIntervalDays} setBulkIntervalDays={setBulkIntervalDays} bulkCount={bulkCount} setBulkCount={setBulkCount}
        bulkDuration={bulkDuration} setBulkDuration={setBulkDuration} bulkMarksPerQ={bulkMarksPerQ} setBulkMarksPerQ={setBulkMarksPerQ}
        onSave={handleBulkCreateSets} saving={saving}
      />

      <CQQuestionSearchDialog
        open={searchDialogOpen} onOpenChange={setSearchDialogOpen}
        searchCqClassLevel={searchCqClassLevel} setSearchCqClassLevel={setSearchCqClassLevel} classLevelLabels={classLevelLabels}
        searchCqSubjectId={searchCqSubjectId} setSearchCqSubjectId={setSearchCqSubjectId} searchCqSubjects={searchCqSubjects}
        searchCqChapterId={searchCqChapterId} setSearchCqChapterId={setSearchCqChapterId} searchCqChapters={searchCqChapters}
        searchCqText={searchCqText} setSearchCqText={setSearchCqText} onSearch={handleSearchCqs} loading={searchCqLoading}
        results={searchCqs} selectedIds={selectedCqIds} setSelectedIds={setSelectedCqIds}
        alreadyInSetIds={currentSet?.questions?.map(q => q.cqId).filter((id): id is string => id !== null) || []} saving={saving} onAddSelected={handleAddCqs}
        onClassChange={(val) => { setSearchCqClassLevel(val === '_all' ? '' : val); setSearchCqSubjectId(''); setSearchCqChapterId(''); fetchSearchCqSubjects(val === '_all' ? '' : val); }}
        onSubjectChange={(val) => { setSearchCqSubjectId(val === '_all' ? '' : val); setSearchCqChapterId(''); fetchSearchCqChapters(val === '_all' ? '' : val); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {deleteTarget?.type === 'package' ? 'প্যাকেজ ডিলিট' : 'এক্সাম সেট ডিলিট'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'package'
                ? 'আপনি কি নিশ্চিত এই এক্সাম প্যাকেজ মুছে ফেলতে চান? এর সকল এক্সাম সেট, প্রশ্ন ও ফলাফলও মুছে যাবে।'
                : 'আপনি কি নিশ্চিত এই এক্সাম সেট মুছে ফেলতে চান? এর সকল প্রশ্ন ও ফলাফলও মুছে যাবে।'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">ডিলিট করুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
