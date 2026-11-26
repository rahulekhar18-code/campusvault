import React, { useState } from 'react';
import { unlockResource } from '../api/client';
import { 
  Lock, 
  Unlock, 
  Coins, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function UnlockResourceModal({
  resource,
  user,
  onClose,
  onUnlocked,
  onOpenRewards
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!resource) return null;

  const cost = Math.max(1, resource.creditCost ?? 10);
  const userCredits = user?.credits ?? 0;
  const hasSufficientCredits = userCredits >= cost;
  const remainingCredits = Math.max(0, userCredits - cost);

  const referralCode = user?.referralCode || 'CAMPUSVAULT';
  const siteUrl = window.location.origin;
  const inviteUrl = `${siteUrl}?ref=${referralCode}`;
  const whatsappMessage = `Hey! Check out CampusVault - access verified college notes, PYQs, and study materials. Sign up with my link to instantly get 75 free study credits: ${inviteUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleConfirmUnlock = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await unlockResource(resource.id);
      if (onUnlocked) {
        onUnlocked(resource.id, res.creditsRemaining);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to unlock resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50/70 to-orange-50/40 border-b border-amber-100/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Unlock Resource</h3>
              <p className="text-xs text-gray-500">Access offline download & permanent vault access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Resource Preview Snippet */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  {resource.category || 'Study Material'}
                </span>
                <h4 className="font-semibold text-gray-900 text-sm mt-1 truncate" title={resource.title}>
                  {resource.title}
                </h4>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                <span>{cost}</span>
                <span className="text-[10px]">🪙</span>
              </span>
            </div>

            <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-gray-200/60">
              <span><strong>Subject:</strong> {resource.subject}</span>
              <span><strong>Unit:</strong> {resource.unit || 'Unit 1'}</span>
              <span><strong>Branch:</strong> {resource.branch} (Sem {resource.semester})</span>
            </div>
          </div>

          {/* Pricing & Credit Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 font-medium">Your Study Credits</span>
              <span className="font-bold text-gray-900 flex items-center space-x-1">
                <span>{userCredits}</span>
                <span>🪙</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 font-medium">Credit Cost</span>
              <span className="font-bold text-amber-700 flex items-center space-x-1">
                <span>-{cost}</span>
                <span>🪙</span>
              </span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-800">Remaining Balance</span>
              <span className={`font-bold flex items-center space-x-1 ${hasSufficientCredits ? 'text-emerald-700' : 'text-red-600'}`}>
                <span>{hasSufficientCredits ? remainingCredits : 'Insufficient'}</span>
                {hasSufficientCredits && <span>🪙</span>}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Insufficient Credits: WhatsApp Referral Section */}
          {!hasSufficientCredits && (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Need More Study Credits?</h5>
                  <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
                    Invite classmates on WhatsApp. When they sign up, <strong>you earn +25 Credits</strong> and they get <strong>75 welcome credits</strong>!
                  </p>
                </div>
              </div>

              {/* Action Buttons for WhatsApp & Copy */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite on WhatsApp (+25 🪙)</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>

              {onOpenRewards && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRewards();
                    }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>View all ways to earn credits</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sufficient Credits: Guarantee Notice */}
          {hasSufficientCredits && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Permanently adds this resource to your <strong>Unlock Hub</strong>. You will be able to download and access it offline anytime.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200/80 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {hasSufficientCredits ? (
            <button
              type="button"
              onClick={handleConfirmUnlock}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{loading ? 'Unlocking...' : `Confirm Unlock (${cost} 🪙)`}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.open(whatsappShareUrl, '_blank');
              }}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] rounded-lg shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Earn Credits</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
