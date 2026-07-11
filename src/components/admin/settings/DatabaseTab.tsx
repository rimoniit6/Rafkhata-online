import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle2, Database, Download, FileJson, Info, Loader2, RefreshCw, Terminal, Trash2, Upload } from 'lucide-react'
import React, { useRef } from 'react'

export function DatabaseTab({
  exporting, handleExport,
  importFile, setImportFile,
  importing, importProgress,
  importResults, setImportResults,
  handleImport,
  deleteStep, setDeleteStep,
  deleteConfirmText, setDeleteConfirmText,
  deleting, handleDeleteAll, cancelDelete,
}: {
  exporting: boolean; handleExport: () => Promise<void>
  importFile: File | null; setImportFile: (v: File | null) => void
  importing: boolean; importProgress: number
  importResults: Record<string, { imported: number; errors: number }> | null; setImportResults: (v: null) => void
  handleImport: () => Promise<void>
  deleteStep: number; setDeleteStep: (v: number) => void
  deleteConfirmText: string; setDeleteConfirmText: (v: string) => void
  deleting: boolean; handleDeleteAll: () => Promise<void>; cancelDelete: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-emerald-600" />
            সুপার অ্যাডমিন ব্যবস্থাপনা
          </CardTitle>
          <CardDescription>সুপার অ্যাডমিন তৈরি ও পরিচালনার জন্য CLI কমান্ড ব্যবহার করুন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Terminal className="size-4 text-blue-600 shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p><code className="font-mono font-semibold">npm run create-super-admin &lt;email&gt;</code> — ব্যবহারকারীকে সুপার অ্যাডমিন করুন</p>
              <p><code className="font-mono font-semibold">npm run list-super-admins</code> — সব সুপার অ্যাডমিন দেখুন</p>
              <p><code className="font-mono font-semibold">npm run revoke-super-admin &lt;email&gt;</code> — সুপার অ্যাডমিনের ভূমিকা প্রত্যাহার করুন</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">সুপার অ্যাডমিন শুধুমাত্র CLI স্ক্রিপ্টের মাধ্যমে তৈরি/পরিবর্তন করা যায়। শেষ সুপার অ্যাডমিনকে সরানো যাবে না।</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Download className="h-5 w-5 text-blue-600" /> ডাটাবেজ এক্সপোর্ট</CardTitle>
          <CardDescription>সম্পূর্ণ ডাটাবেজের ব্যাকআপ JSON ফাইল হিসেবে ডাউনলোড করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-4">
            <Info className="size-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">এক্সপোর্ট করা JSON ফাইলে সকল ডাটা অন্তর্ভুক্ত থাকবে। এই ফাইল দিয়ে পরে ইম্পোর্ট করা যাবে।</p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileJson className="size-4" />}
            {exporting ? 'এক্সপোর্ট হচ্ছে...' : 'এক্সপোর্ট করুন'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-5 w-5 text-amber-600" /> ডাটাবেজ ইম্পোর্ট</CardTitle>
          <CardDescription>পূর্বে এক্সপোর্ট করা JSON ব্যাকআপ ফাইল থেকে ডাটা পুনরুদ্ধার করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">ইম্পোর্ট করলে বর্তমান সকল ডাটা মুছে যাবে এবং ফাইলের ডাটা দিয়ে প্রতিস্থাপিত হবে। সুপার অ্যাডমিন .env থেকে পুনরায় তৈরি হবে।</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept=".json" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResults(null) }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950/30 dark:file:text-amber-300" />
            </div>
            {importFile && (
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="size-4 text-amber-600" />
                <span>{importFile.name}</span>
                <Badge variant="secondary" className="text-xs">{(importFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">ইম্পোর্ট হচ্ছে... {importProgress}%</p>
              </div>
            )}
            {importResults && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">ইম্পোর্ট ফলাফল:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {Object.entries(importResults).map(([key, val]) => (
                    <div key={key} className="text-xs">
                      <span className="text-muted-foreground">{key}:</span>{' '}
                      <span className="text-emerald-700 dark:text-emerald-300">{val.imported}</span>
                      {val.errors > 0 && <span className="text-red-500 ml-1">({val.errors} ত্রুটি)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleImport} disabled={!importFile || importing}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {importing ? 'ইম্পোর্ট হচ্ছে...' : 'ইম্পোর্ট করুন'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400"><Trash2 className="h-5 w-5" /> সকল ডাটা ডিলিট</CardTitle>
          <CardDescription>সতর্কতা: এই অপশন সম্পূর্ণ ডাটাবেজ মুছে ফেলবে!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4">
            <AlertTriangle className="size-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">এই কাজটি অপরিবর্তনীয়! সকল ডাটা ডিলিট হয়ে যাবে। তবে সুপার অ্যাডমিন (.env ফাইল থেকে) পুনরায় তৈরি হবে।</p>
          </div>
          {deleteStep === 0 && (
            <Button variant="destructive" className="gap-2" onClick={() => setDeleteStep(1)}>
              <Trash2 className="size-4" /> সকল ডাটা ডিলিট করুন
            </Button>
          )}
          {deleteStep >= 1 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 1 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`size-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${deleteStep > 1 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {deleteStep > 1 ? <CheckCircle2 className="size-4" /> : '১'}
                  </div>
                  <span className="font-medium text-sm">প্রথম ধাপ: আপনি কি নিশ্চিত?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">সকল ব্যবহারকারী, কন্টেন্ট, পেমেন্ট, প্রশ্ন এবং অন্যান্য ডাটা ডিলিট হয়ে যাবে।</p>
                {deleteStep === 1 && (
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setDeleteStep(2)}>হ্যাঁ, আমি নিশ্চিত</Button>
                    <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                  </div>
                )}
              </div>
              {deleteStep >= 2 && (
                <div className={`p-4 rounded-lg border-2 transition-colors ${deleteStep === 2 ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30' : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`size-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${deleteStep > 2 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {deleteStep > 2 ? <CheckCircle2 className="size-4" /> : '২'}
                    </div>
                    <span className="font-medium text-sm">দ্বিতীয় ধাপ: এটি অপরিবর্তনীয়!</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">ডিলিট হলে ডাটা আর ফিরে পাওয়া যাবে না। আপনি কি সত্যিই সব মুছে ফেলতে চান?</p>
                  {deleteStep === 2 && (
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => setDeleteStep(3)}>হ্যাঁ, সব মুছে ফেলুন</Button>
                      <Button variant="outline" size="sm" onClick={cancelDelete}>বাতিল</Button>
                    </div>
                  )}
                </div>
              )}
              {deleteStep >= 3 && (
                <div className="p-4 rounded-lg border-2 border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-red-600">৩</div>
                    <span className="font-medium text-sm text-red-700 dark:text-red-300">চূড়ান্ত ধাপ: টাইপ করুন &quot;ডিলিট করুন&quot;</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">নিচের ফিল্ডে <strong className="text-red-600 dark:text-red-400">&quot;ডিলিট করুন&quot;</strong> লিখুন ডিলিট নিশ্চিত করতে:</p>
                  <div className="space-y-3">
                    <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder='ডিলিট করুন' className="border-red-300 focus:border-red-500 dark:border-red-700" />
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={deleteConfirmText !== 'ডিলিট করুন' || deleting} className="gap-2">
                        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        {deleting ? 'ডিলিট হচ্ছে...' : 'সকল ডাটা ডিলিট করুন'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelDelete} disabled={deleting}>বাতিল</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
