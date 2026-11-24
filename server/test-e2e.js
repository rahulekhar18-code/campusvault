import assert from 'assert';
import { prisma } from './src/config/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const contentType = res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function runTests() {
  console.log('--- Starting CampusVault E2E Integration Tests ---');

  // 1. Health check
  const health = await request('/health');
  assert.strictEqual(health.status, 200, 'Health check should be 200');
  console.log('✓ Health check passed');

  // 2. Reject non-college emails
  const invalidEmailRes = await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email: 'hacker@gmail.com' })
  });
  assert.strictEqual(invalidEmailRes.status, 400, 'Non @ycce.in email should be rejected');
  console.log('✓ Non-@ycce.in registration rejected');

  // 3. Register Student Account with OTP
  const studentEmail = `student_${Date.now()}@ycce.in`;
  const studentOtpRes = await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail })
  });
  assert.strictEqual(studentOtpRes.status, 200, 'OTP send for student should be 200');
  const studentOtp = studentOtpRes.data.devOtp;
  assert.ok(studentOtp, 'Dev OTP should be available');
  console.log('✓ Student OTP sent successfully');

  const studentReg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: 'studentPassword123',
      otp: studentOtp
    })
  });
  assert.strictEqual(studentReg.status, 201, 'Student registration should be 201');
  assert.strictEqual(studentReg.data.user.role, 'STUDENT', 'User should have STUDENT role');
  const studentToken = studentReg.data.token;
  console.log('✓ Student registration and STUDENT role verified');

  // 4. Duplicate registration prevention
  const dupOtpRes = await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail })
  });
  assert.strictEqual(dupOtpRes.status, 400, 'Duplicate email should be rejected');
  console.log('✓ Duplicate registration prevention verified');

  // 5. Register / Initialize Admin Account (24071279@ycce.in)
  const adminEmail = '24071279@ycce.in';
  const adminOtpRes = await request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail })
  });
  const adminOtp = adminOtpRes.data.devOtp;

  const adminReg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: 'AdminSuperPassword2026',
      otp: adminOtp
    })
  });
  assert.strictEqual(adminReg.status, 201, 'Admin registration should be 201');
  assert.strictEqual(adminReg.data.user.role, 'ADMIN', '24071279@ycce.in must have ADMIN role');
  const adminToken = adminReg.data.token;
  console.log('✓ Admin account setup and secure ADMIN role verified');

  // 6. Admin login through the same login route
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password: 'AdminSuperPassword2026'
    })
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
  assert.strictEqual(adminLogin.data.user.role, 'ADMIN', 'Admin login must return ADMIN role');
  console.log('✓ Admin login through same portal verified');

  // 7. Student Uploads a file (Status must be PENDING)
  const fileContent = 'Sample Lecture Notes for DBMS Unit 1 - Database Systems';
  const testBlob = new Blob([fileContent], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('title', 'DBMS Unit 1 Notes');
  formData.append('branch', 'IT');
  formData.append('semester', '5');
  formData.append('subject', 'DBMS');
  formData.append('category', 'Notes');
  formData.append('file', testBlob, 'dbms_unit1.pdf');

  const uploadRes = await request('/resources/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: formData
  });
  assert.strictEqual(uploadRes.status, 201, 'Upload should succeed');
  assert.strictEqual(uploadRes.data.resource.status, 'PENDING', 'Student upload must be PENDING');
  const resourceId = uploadRes.data.resource.id;
  console.log('✓ Student upload saved to private storage with status PENDING');

  // 8. Pending file should NOT be visible on Read Files
  const readFiles1 = await request('/resources', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(readFiles1.status, 200);
  const foundInRead = readFiles1.data.find(r => r.id === resourceId);
  assert.strictEqual(foundInRead, undefined, 'Pending file must NOT be visible on Read Files');
  console.log('✓ Pending file verified hidden from Read Files');

  // 9. Student can see their own upload status in My Uploads
  const myUploads = await request('/resources/my-uploads', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(myUploads.status, 200);
  const foundInMyUploads = myUploads.data.find(r => r.id === resourceId);
  assert.ok(foundInMyUploads, 'Student should see their own upload');
  assert.strictEqual(foundInMyUploads.status, 'PENDING');
  console.log('✓ Student can view status of their own upload');

  // 10. Student can edit pending upload
  const editRes = await request(`/resources/${resourceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ title: 'DBMS Unit 1 Complete Notes' })
  });
  assert.strictEqual(editRes.status, 200, 'Student should be able to edit pending file');
  assert.strictEqual(editRes.data.resource.title, 'DBMS Unit 1 Complete Notes');
  console.log('✓ Student editing pending submission verified');

  // 11. Student forbidden from admin actions
  const studentAdminAttempt = await request('/admin/pending', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentAdminAttempt.status, 403, 'Student must receive 403 Forbidden for admin routes');
  console.log('✓ Server-side admin role protection verified (403 Forbidden)');

  // 12. Admin sees pending submission in approval panel
  const adminPending = await request('/admin/pending', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminPending.status, 200);
  const pendingItem = adminPending.data.find(r => r.id === resourceId);
  assert.ok(pendingItem, 'Admin must see pending submission');
  console.log('✓ Admin pending list retrieval verified');

  // 13. Admin securely downloads / previews pending file
  const adminDownload = await request(`/resources/${resourceId}/download`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminDownload.status, 200, 'Admin can download pending file');
  assert.strictEqual(adminDownload.data, fileContent, 'Downloaded content must match uploaded file');
  console.log('✓ Private storage secure download verified');

  // 14. Admin approves the resource
  const approveRes = await request(`/admin/resources/${resourceId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.resource.status, 'APPROVED');
  console.log('✓ Admin approval workflow verified');

  // 15. Now resource appears in Read Files for students
  const readFiles2 = await request('/resources?branch=IT&semester=5', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(readFiles2.status, 200);
  const nowApproved = readFiles2.data.find(r => r.id === resourceId);
  assert.ok(nowApproved, 'Approved file must now appear on Read Files');
  console.log('✓ Approved file verified on Read Files with filter');

  // 16. Student can download approved file
  const studentDownload = await request(`/resources/${resourceId}/download`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentDownload.status, 200);
  assert.strictEqual(studentDownload.data, fileContent);
  console.log('✓ Student downloading approved file verified');

  // 17. Admin changes application name, logo, and theme color
  const updateSettingsRes = await request('/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      appName: 'CampusVault YCCE',
      themeColor: '#7c3aed',
      logoUrl: 'https://ycce.in/logo.png',
      storageRoot: 'college-vault'
    })
  });
  assert.strictEqual(updateSettingsRes.status, 200);
  assert.strictEqual(updateSettingsRes.data.settings.appName, 'CampusVault YCCE');
  assert.strictEqual(updateSettingsRes.data.settings.themeColor, '#7c3aed');

  // Verify settings are reflected publicly
  const publicSettings = await request('/settings');
  assert.strictEqual(publicSettings.status, 200);
  assert.strictEqual(publicSettings.data.appName, 'CampusVault YCCE');
  assert.strictEqual(publicSettings.data.themeColor, '#7c3aed');
  console.log('✓ Global application name and theme customization verified');

  // 18. Admin direct upload (auto approved)
  const adminDirectFormData = new FormData();
  adminDirectFormData.append('title', 'OS PYQ 2024');
  adminDirectFormData.append('branch', 'IT');
  adminDirectFormData.append('semester', '5');
  adminDirectFormData.append('subject', 'Operating Systems');
  adminDirectFormData.append('category', 'PYQ');
  adminDirectFormData.append('file', new Blob(['PYQ Questions 2024'], { type: 'application/pdf' }), 'os_pyq_2024.pdf');

  const adminUploadRes = await request('/resources/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: adminDirectFormData
  });
  assert.strictEqual(adminUploadRes.status, 201);
  assert.strictEqual(adminUploadRes.data.resource.status, 'APPROVED', 'Admin upload must be automatically APPROVED');
  console.log('✓ Admin direct upload automatically approved verified');

  console.log('=== ALL 18 INTEGRATION TESTS PASSED PERFECTLY ===');
}

runTests()
  .catch((err) => {
    console.error('Test failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
