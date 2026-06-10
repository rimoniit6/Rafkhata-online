const BASE = 'http://localhost:3000';
const errors = [];
const passes = [];

function unwrap(json) {
  return json?.data ?? json;
}

async function login(email, password) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const tokenMatch = setCookie.match(/auth-token=([^;]+)/);
  const cookie = tokenMatch ? `auth-token=${tokenMatch[1]}` : '';
  return { cookie, status: res.status, json: await res.json() };
}

async function api(url, options = {}, cookie) {
  const headers = { ...options.headers };
  if (cookie) headers['Cookie'] = cookie;
  if (typeof options.body === 'string') headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + url, { ...options, headers });
  const json = await res.json();
  return { status: res.status, json, data: unwrap(json) };
}

async function test(name, fn) {
  try {
    await fn();
    passes.push(`PASS: ${name}`);
  } catch (e) {
    errors.push(`FAIL: ${name} — ${e.message}`);
  }
}

async function main() {
  // Login
  const { cookie } = await login('moderator@shikhabangla.com', 'admin123');
  if (!cookie) {
    console.error('Login failed — no cookie');
    process.exit(1);
  }
  console.log('Login OK');

  // Get class ID
  const { data: classesData } = await api('/api/classes');
  const classId = classesData.classes?.[0]?.id;
  if (!classId) throw new Error('No classes found');

  // Get a CQ for questions
  const { data: cqsData } = await api('/api/cq?limit=5');
  const cqId = Array.isArray(cqsData) ? cqsData[0]?.id : cqsData.cqs?.[0]?.id;
  console.log(`classId=${classId}, cqId=${cqId}`);

  // Get a student user ID for exam testing
  const { json: loginJson } = await login('rahul@student.com', 'Student123');
  const studentId = loginJson.data?.user?.id;
  if (!studentId) throw new Error('Could not get student user');
  console.log(`studentId=${studentId}`);

  // ─── Admin: Create Package ───
  let pkgId, setId, submissionId, firstAnswerId, imageId;
  await test('Admin: Create CQ Exam Package', async () => {
    const { data } = await api('/api/admin/cq-exam-packages', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create-package',
        title: 'Test Package', description: 'Testing',
        classId, price: 100, originalPrice: 150, isPremium: true,
        status: 'published', isActive: true, order: 0,
      }),
    }, cookie);
    if (!data.package?.id) throw new Error('No package created: ' + JSON.stringify(data));
    pkgId = data.package.id;
  });

  await test('Admin: List Packages', async () => {
    const { data } = await api('/api/admin/cq-exam-packages?action=list', {}, cookie);
    const pkgs = data.packages || data;
    if (!Array.isArray(pkgs)) throw new Error('Expected array');
  });

  await test('Admin: Get Package Detail', async () => {
    const { data } = await api(`/api/admin/cq-exam-packages?action=detail&id=${pkgId}`, {}, cookie);
    if (!data.package) throw new Error('Package detail missing');
    if (!Array.isArray(data.examSets)) throw new Error('examSets not included');
  });

  // ─── Admin: Create Set ───
  await test('Admin: Create Exam Set', async () => {
    const { data } = await api('/api/admin/cq-exam-packages', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create-set',
        packageId: pkgId,
        title: 'Test Set 1',
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '00:00', endTime: '23:59',
        duration: 30, marksPerQ: 8, status: 'published', order: 0,
      }),
    }, cookie);
    if (!data.set?.id) throw new Error('Set not created: ' + JSON.stringify(data));
    setId = data.set.id;
    console.log(`  Set created: ${setId}`);
  });

  // ─── Admin: Add Questions to Set ───
  if (cqId) {
    await test('Admin: Add CQ Questions to Set', async () => {
      const { data, status } = await api('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add-questions',
          setId,
          cqIds: [cqId],
          marks: [8],
        }),
      }, cookie);
      if (!data.created?.length) throw new Error(`Add questions failed: ${JSON.stringify(data)}`);
    });

    await test('Admin: Get Set Detail', async () => {
      const { data } = await api(`/api/admin/cq-exam-packages?action=set-detail&setId=${setId}`, {}, cookie);
      if (!data.set?.questions?.length) throw new Error('Questions missing');
    });
  }

  // ─── Public API ───
  await test('Public: List Packages', async () => {
    const { json } = await api('/api/cq-exam-packages?action=list');
    if (!Array.isArray(json.packages)) throw new Error('Expected packages array');
  });

  await test('Public: Get Package Detail', async () => {
    const { json } = await api(`/api/cq-exam-packages?action=detail&id=${pkgId}`, {}, cookie);
    if (!json.package) throw new Error('Package detail missing');
    if (typeof json.hasPurchased !== 'boolean') throw new Error('hasPurchased missing');
  });

  if (cqId && setId) {
    await test('Public: Get Set Detail', async () => {
      const { json } = await api(`/api/cq-exam-packages?action=set-detail&setId=${setId}`);
      if (!json.set?.questions?.length) throw new Error('Set questions missing');
    });

    // ─── Start Exam ───
    await test('Public: Start Exam', async () => {
      const { json } = await api('/api/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({ action: 'start-exam', setId, userId: studentId }),
      }, cookie);
      if (!json.submission?.id) throw new Error('No submission: ' + JSON.stringify(json));
      submissionId = json.submission.id;
      const ansMap = {};
      for (const ans of json.submission.answers || []) {
        if (!ansMap[ans.questionId]) ansMap[ans.questionId] = [];
        ansMap[ans.questionId][ans.subIndex] = ans.id;
      }
      firstAnswerId = Object.values(ansMap).flat().filter(Boolean)[0];
      console.log(`  submissionId=${submissionId}, firstAnswerId=${firstAnswerId}`);
    });

    if (firstAnswerId) {
      await test('Public: Save Answer', async () => {
        const { json } = await api('/api/cq-exam-packages', {
          method: 'POST',
          body: JSON.stringify({
            action: 'save-answer',
            answerId: firstAnswerId,
            answerText: 'Test answer text',
          }),
        }, cookie);
        if (json.error) throw new Error(json.error);
      });

      await test('Public: Add Image to Answer', async () => {
        const { json } = await api('/api/cq-exam-packages', {
          method: 'POST',
          body: JSON.stringify({
            action: 'add-image',
            answerId: firstAnswerId,
            imageUrl: '/uploads/test-image.jpg',
          }),
        }, cookie);
        if (json.error) throw new Error(json.error);
        if (!json.image?.id) throw new Error('Image not created');
        imageId = json.image.id;
      });

      if (imageId) {
        await test('Public: Remove Image', async () => {
          const { json } = await api('/api/cq-exam-packages', {
            method: 'POST',
            body: JSON.stringify({ action: 'remove-image', imageId }),
          }, cookie);
          if (json.error) throw new Error(json.error);
        });
      }
    }

    await test('Public: Submit Exam', async () => {
      const { json } = await api('/api/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({ action: 'submit-exam', submissionId, timeTaken: 120 }),
      }, cookie);
      if (json.error) throw new Error(json.error);
    });

    await test('Public: Get My Submission', async () => {
      const { json } = await api(`/api/cq-exam-packages?action=my-submission&submissionId=${submissionId}`, {}, cookie);
      if (json.error) throw new Error(json.error);
      if (!json.submission) throw new Error('Submission not returned');
      if (!json.submission.set?.questions?.length) throw new Error('Questions missing from submission');
    });

    // ─── Admin: Grading ───
    await test('Admin: List Submissions', async () => {
      const { data } = await api(`/api/admin/cq-exam-packages?action=submissions&setId=${setId}`, {}, cookie);
      const subs = data.submissions || data;
      if (!Array.isArray(subs)) throw new Error('Submissions not returned');
    });

    await test('Admin: Get Submission Detail', async () => {
      const { data } = await api(`/api/admin/cq-exam-packages?action=submission-detail&submissionId=${submissionId}`, {}, cookie);
      if (!data.submission) throw new Error('Submission detail missing');
      if (!data.submission.set?.questions?.length) throw new Error('Questions missing');
    });

    await test('Admin: Grade Submission', async () => {
      const { data } = await api(`/api/admin/cq-exam-packages?action=submission-detail&submissionId=${submissionId}`, {}, cookie);
      const answers = data.submission?.answers?.map(a => ({
        id: a.id, obtainedMarks: a.maxMarks, feedback: 'Excellent!'
      })) || [];
      const { json } = await api('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'grade-submission', submissionId, answers }),
      }, cookie);
      if (json.error) throw new Error(json.error);
    });

    await test('Admin: Publish Results', async () => {
      const { json } = await api('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'publish-results', setId }),
      }, cookie);
      if (json.error) throw new Error(json.error);
    });
  }

  // ─── Admin: Update Package ───
  await test('Admin: Update Package', async () => {
    const { json } = await api('/api/admin/cq-exam-packages', {
      method: 'PUT',
      body: JSON.stringify({ action: 'update-package', id: pkgId, title: 'Updated Package' }),
    }, cookie);
    if (json.error) throw new Error(json.error);
  });

  // ─── Bulk Create Sets ───
  await test('Admin: Bulk Create Sets (3x)', async () => {
    const baseDate = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i * 7);
      const { json } = await api('/api/admin/cq-exam-packages', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create-set',
          packageId: pkgId,
          title: `Bulk Set ${i + 1}`,
          scheduledDate: date.toISOString().split('T')[0],
          startTime: '00:00', endTime: '23:59',
          duration: 30, marksPerQ: 8, status: 'draft', order: i,
        }),
      }, cookie);
      if (json.error) throw new Error(`Set ${i}: ${json.error}`);
    }
  });

  // ─── Remove Question ───
  if (cqId && setId) {
    await test('Admin: Remove Question from Set', async () => {
      const { json } = await api('/api/admin/cq-exam-packages', {
        method: 'PUT',
        body: JSON.stringify({ action: 'remove-question', setId, cqId }),
      }, cookie);
      if (json.error) throw new Error(json.error);
    });
  }

  // ─── Results ───
  console.log(`\n=== RESULTS ===`);
  console.log(`Passed: ${passes.length}`);
  for (const p of passes) console.log(`  ${p}`);
  console.log(`\nFailed: ${errors.length}`);
  for (const e of errors) console.log(`  ${e}`);

  // Cleanup
  if (pkgId) {
    await api(`/api/admin/cq-exam-packages?action=delete-package&id=${pkgId}`, { method: 'DELETE' }, cookie);
    console.log(`\nCleaned up: deleted package ${pkgId}`);
  }
}

main().catch(console.error);
