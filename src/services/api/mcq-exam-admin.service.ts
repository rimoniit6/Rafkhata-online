import { api } from '@/lib/api-client'
import { 
  MCQExamPackageRecord, 
  MCQExamSetRecord, 
  MCQExamSetResultRecord,
  MCQSearchResult
} from '@/features/mcq-exam/types'

export const mcqExamAdminService = {
  // Packages
  listPackages: (params: any) => 
    api.get<{ packages: MCQExamPackageRecord[], pagination: any }>('admin/mcq-exam-packages', { action: 'list', ...params }),
  
  getPackageDetail: (id: string) => 
    api.get<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'detail', id }),
  
  createPackage: (data: any) => 
    api.post<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'create-package', ...data }),
  
  updatePackage: (id: string, data: any) => 
    api.put<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'update-package', id, ...data }),
  
  deletePackage: (id: string) => 
    api.delete('admin/mcq-exam-packages', { action: 'delete-package', id }),

  // Exam Sets
  getSetDetail: (setId: string) => 
    api.get<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'set-detail', setId }),
  
  createSet: (data: any) => 
    api.post<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'create-set', ...data }),
  
  updateSet: (id: string, data: any) => 
    api.put<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'update-set', id, ...data }),
  
  deleteSet: (id: string) => 
    api.delete('admin/mcq-exam-packages', { action: 'delete-set', id }),
  
  bulkCreateSets: (data: any) => 
    api.post<{ sets: MCQExamSetRecord[], count: number }>('admin/mcq-exam-packages', { action: 'bulk-create-sets', ...data }),

  // Questions
  searchMcqs: (params: any) => 
    api.get<{ mcqs: MCQSearchResult[], pagination: any }>('admin/mcq-exam-packages', { action: 'search-mcqs', ...params }),
  
  addQuestions: (setId: string, mcqIds: string[]) => 
    api.post('admin/mcq-exam-packages', { action: 'add-questions', setId, mcqIds }),
  
  removeQuestion: (setId: string, mcqId: string) => 
    api.delete('admin/mcq-exam-packages', { action: 'remove-question', setId, mcqId }),
  
  reorderQuestions: (setId: string, questionOrders: { id: string, order: number }[]) => 
    api.put('admin/mcq-exam-packages', { action: 'reorder-questions', setId, questionOrders }),

  // Results & Leaderboard
  getResults: (setId: string) => 
    api.get<{ results: MCQExamSetResultRecord[] }>('admin/mcq-exam-packages', { action: 'results', setId }),
  
  getLeaderboard: (setId: string) => 
    api.get<{ leaderboard: MCQExamSetResultRecord[] }>('admin/mcq-exam-packages', { action: 'leaderboard', setId }),
}
