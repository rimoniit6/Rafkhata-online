'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useTableSelection } from '@/hooks/use-table-selection'
import { FileQuestion } from 'lucide-react'
import MCQEditorView from './mcq/MCQEditorView'
import MCQListView from './mcq/MCQListView'
import { emptyForm } from './mcq/constants'
import { useMCQAdmin } from './mcq/use-mcq-admin'

export default function AdminMCQPage() {
  const admin = useMCQAdmin()

  const {
    loading, mcqs, total, search, setSearch,
    classFilter, setClassFilter, boardFilter, setBoardFilter,
    yearFilter, setYearFilter, difficultyFilter, setDifficultyFilter,
    premiumFilter, setPremiumFilter, page, setPage,
    deleteId, setDeleteId, bulkImportOpen, setBulkImportOpen,
    viewMode, currentStep, setCurrentStep,
    editId, saving, form, setForm,
    classes, subjects, chapters, formClassSlug,
    boardOptions, classLabelMap, boardLabelMap,
    openCreate, openEdit, handleNext, handlePrev, saveMCQ, deleteMCQ,
    fetchMcqs, setViewMode, setSubjects, setChapters, canGoNext,
  } = admin

  const selection = useTableSelection(mcqs)

  const perPage = 10

  const updateForm = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  if (loading && mcqs.length === 0 && viewMode === 'list') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <>
      {viewMode === 'list' ? (
        <MCQListView
          loading={loading}
          mcqs={mcqs}
          total={total}
          page={page}
          perPage={perPage}
          setPage={setPage}
          search={search}
          setSearch={setSearch}
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          boardFilter={boardFilter}
          setBoardFilter={setBoardFilter}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          premiumFilter={premiumFilter}
          setPremiumFilter={setPremiumFilter}
          classes={classes}
          boardOptions={boardOptions}
          classLabelMap={classLabelMap}
          boardLabelMap={boardLabelMap}
          openCreate={openCreate}
          openEdit={openEdit}
          setDeleteId={setDeleteId}
          setBulkImportOpen={setBulkImportOpen}
          bulkImportOpen={bulkImportOpen}
          fetchMcqs={fetchMcqs}
          selection={selection}
        />
      ) : (
        <MCQEditorView
          form={form}
          setForm={setForm}
          editId={editId}
          saving={saving}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          setSubjects={setSubjects}
          setChapters={setChapters}
          formClassSlug={formClassSlug}
          boardOptions={boardOptions}
          boardLabelMap={boardLabelMap}
          setViewMode={setViewMode}
          handleNext={handleNext}
          handlePrev={handlePrev}
          saveMCQ={saveMCQ}
          canGoNext={canGoNext}
          updateForm={updateForm}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MCQ মুছুন</DialogTitle>
            <DialogDescription>
              আপনি কি নিশ্চিত যে এই MCQ মুছে ফেলতে চান? এই কাজটি আর পূর্বাবস্থায় ফেরানো যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={() => deleteMCQ(deleteId!)}>
              মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
