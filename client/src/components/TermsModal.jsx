import React from 'react';
import { ShieldCheck, X, FileText, Check, AlertCircle, Lock, GraduationCap } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Terms of Service & Academic Honor Code
              </h2>
              <p className="text-xs text-gray-500">
                Official usage guidelines for CampusVault academic portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-gray-600 space-y-4 leading-relaxed">
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-blue-900 flex items-start space-x-2.5">
            <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              CampusVault is an exclusive academic resource sharing portal designed to facilitate peer learning, question paper access, and exam revision among verified college students.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>1. Institutional Eligibility & Verification</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Access is strictly restricted to enrolled students, faculty, and administrative staff with verified institutional college email addresses (<code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">@ycce.in</code>). Sharing your account credentials or facilitating unauthorized external access is strictly prohibited.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>2. Academic Integrity & Fair Use</span>
            </h3>
            <p className="text-xs sm:text-sm">
              All syllabus notes, solved question papers, and lab manuals are provided strictly for individual educational study and exam preparation. Commercial redistribution, bulk scraping, or publishing internal college study materials onto third-party commercial platforms is strictly forbidden.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>3. Digital Rights Management & Anti-Piracy Watermarking</span>
            </h3>
            <p className="text-xs sm:text-sm">
              To safeguard academic materials and prevent unauthorized leaks, documents rendered within the viewer carry dynamic, forensic student watermarks (including student ID, email address, and access timestamps). Users acknowledge that capturing, tampering with, or circulating watermarked files violates the student honor code and may result in disciplinary tracking.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>4. Uploader Code of Conduct</span>
            </h3>
            <p className="text-xs sm:text-sm">
              By uploading study files, you confirm that the material is academically beneficial, accurate, and does not contain malicious code, commercial advertisements, or non-educational content. The administration reserves full rights to review, approve, reject, or purge any submission.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>5. Privacy & Data Handling</span>
            </h3>
            <p className="text-xs sm:text-sm">
              We collect minimal data required for authentication, role verification, and personal bookmark persistence. We do not track personal web activity outside the portal or monetize student data in any manner.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>6. Disciplinary Compliance</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Breach of these terms, malicious tampering, or distribution of sensitive exam materials may result in immediate revocation of portal access and formal reporting to the college disciplinary committee.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center space-x-1.5">
              <span>7. Support & Inquiries</span>
            </h3>
            <p className="text-xs sm:text-sm">
              For academic queries, feedback, or portal support, please contact the administrator directly at <a href="mailto:rahulekhar18@gmail.com" className="text-blue-600 underline font-semibold">rahulekhar18@gmail.com</a>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
          <span className="text-[11px] text-gray-400">
            Last revised: Academic Session 2025–26
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>I Understand & Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
