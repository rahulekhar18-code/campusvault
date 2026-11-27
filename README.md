# CampusVault 🎓
> Simple, lightweight, and fully functional college notes-sharing website for YCCE.

Built with **React + Vite**, **Tailwind CSS**, **Node.js + Express**, **PostgreSQL + Prisma**, and **Private Supabase Storage**.

---

## 🌟 Key Features

1. **Maximum 3 Main Pages & Zero Clutter**:
   - **Page 1: Login / Signup** (`@ycce.in` email restriction, OTP verification, unified login for students and admin).
   - **Page 2: Read Files** (Search and filter by Branch, Semester, Subject, Category; one-click secure download for approved resources).
   - **Page 3: Upload Files** (Submit resources, view personal submission status, edit or delete pending uploads).

2. **Embedded Admin Approval & Customization Panel**:
   - Accessible directly within the application for the admin (not a separate bloated dashboard).
   - **Pending Approvals**: View student uploads, securely preview/download, approve or reject with custom feedback, and edit metadata.
   - **Direct Upload**: Faculty/Admin files are automatically approved and instantly published.
   - **Global Branding & Theme Customizer**: Real-time database-driven application name, logo, and theme color customizer (Blue, Purple, Emerald, Orange, or custom hex). Immediately updates across all devices and student sessions without redeployment.
   - **Configurable Storage Folder Convention**: Customizable root folder and folder templates (e.g. `{branch}/{semester}/{subject}/{category}`). Existing files remain accessible.

3. **Enterprise Security & Data Protection**:
   - Strict `@ycce.in` college email domain validation.
   - Secure server-side role assignment for initial admin email: `24071279@ycce.in`.
   - Never hardcodes passwords; password hashing with `bcrypt` (10 rounds) + JWT authentication.
   - Private Supabase Storage bucket (`campusvault-files`) with authenticated server-side streaming.
   - Students cannot view or download other students' pending submissions.
   - All admin mutations strictly protected with 403 Forbidden verification.

---

## 📁 Project Structure

```
campusvault/
├── server/
│   ├── prisma/
│   │   └── schema.prisma        # User, Resource, AppSettings models
│   ├── src/
│   │   ├── config/              # db.js, storage.js
│   │   ├── controllers/         # auth, resource, settings, admin controllers
│   │   ├── middleware/          # authMiddleware, uploadMiddleware (25MB limit)
│   │   ├── routes/              # auth, resource, settings, admin routes
│   │   ├── utils/               # emailService (OTP & nodemailer)
│   │   └── index.js             # Express API entry point (port 5000)
│   └── test-e2e.js              # Automated 18-step E2E integration test suite
│
└── client/
    ├── src/
    │   ├── api/client.js        # Authenticated fetch & secure download helper
    │   ├── context/             # AuthContext, AppSettingsContext (dynamic theme CSS vars)
    │   ├── components/          # Navbar, AdminPanel, EditResourceModal
    │   ├── pages/               # AuthPage, ReadFilesPage, UploadFilesPage
    │   ├── App.jsx              # Main routing & state controller
    │   └── main.jsx
    └── vite.config.js           # Vite dev server + /api proxy
```

---

## 🚀 Running the Project

### 1. Start the Backend API (Port 5000)
```bash
cd server
npm start
```

### 2. Start the Frontend (Port 5173)
```bash
cd client
npm run dev
```

### 3. Run E2E Test Suite
```bash
npm run test:e2e
```

---

## 🔑 Initial Accounts & Credentials

- **Admin Account**: `24071279@ycce.in`
  - Admin logs in through the exact same login page.
  - Password can be created securely during OTP registration or updated as needed.
- **Student Accounts**: Any verified college email address.

---

## ⭐ Show Your Support

If you find **CampusVault** helpful for your semester study preparation, please consider giving it a **Star (⭐)** on GitHub!  
It helps other college students discover the project and keeps the platform growing.

> **💡 Found this project useful? Give it a ⭐ on GitHub & share it with your batchmates!**

---

## 📬 Contact & Support

For any questions, feedback, or collaborations:
- **Developer & Maintainer**: Rahul
- **Email**: [rahulekhar18@gmail.com](mailto:rahulekhar18@gmail.com)
