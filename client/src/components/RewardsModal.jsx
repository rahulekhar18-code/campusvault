import React, { useState, useEffect } from 'react';
import { fetchUserRewards } from '../api/client';
import { 
  Coins, 
  X, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Upload, 
  Unlock, 
  Users, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function RewardsModal({ user, onClose, onCreditsUpdated }) {
  const [rewardsData, setRewardsData] = useState({
    credits: user?.credits ?? 50,
    referralCode: user?.referralCode || 'CV-YC2026',
    referralCount: 0,
    unlockedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadRewards() {
      try {
        const data = await fetchUserRewards();
        if (data) {
          setRewardsData(data);
          if (onCreditsUpdated && data.credits !== user?.credits) {
            onCreditsUpdated(data.credits);
          }
        }
      } catch (err) {
        console.warn('Could not load user rewards:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRewards();
  }, []);

  const referralCode = rewardsData.referralCode || user?.referralCode || 'CV-STUDENT';
  const siteUrl = window.location.origin;
  const inviteUrl = `${siteUrl}?ref=${referralCode}`;
  const whatsappMessage = `Hey! Check out CampusVault - access verified college notes, PYQs, and study materials. Sign up with my link to instantly get 75 free study credits: ${inviteUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {}
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border-b border-amber-100/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-xs">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center space-x-1.5">
                <span>Study Credits & Rewards</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full">
                  Wallet
                </span>
              </h3>
              <p className="text-xs text-gray-500">Unlock study notes and share with classmates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content (Scrollable if screen is small) */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Main Balance Display Card */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -bottom-6 opacity-15 pointer-events-none">
              <Coins className="w-36 h-36" />
            </div>

            <div className="relative z-10">
              <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
                Available Balance
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {rewardsData.credits}
                </span>
                <span className="text-lg font-medium text-amber-100">Study Credits 🪙</span>
              </div>
              <p className="text-xs text-amber-100/90 mt-2 max-w-sm">
                Credits never expire. Use them anytime to unlock locked resources in <strong>Read Files</strong> for offline download.
              </p>
            </div>
          </div>

          {/* Referral & WhatsApp Share Section */}
          <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">WhatsApp Classmate Invitation</h4>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                +25 🪙 per friend
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Share your link with batchmates on WhatsApp. When they sign up with your code, you receive <strong>+25 study credits</strong> and they get <strong>75 welcome credits</strong>!
            </p>

            {/* Referral Code Display */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Your Referral Code
                </span>
                <span className="font-mono font-bold text-sm text-gray-900 tracking-wider">
                  {referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons: WhatsApp & Copy Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-xs transition-all text-center"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                <span>{copiedLink ? 'Copied Invite Link!' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>

          {/* How to Earn Credits (Non-congested, Clean Grid) */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              How You Earn Study Credits
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-bold text-gray-900 text-xs">+25 Credits</div>
                <div className="text-[11px] text-gray-500 leading-snug">
                  Every batchmate who registers with your link
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="font-bold text-gray-900 text-xs">+20 Credits</div>
                <div className="text-[11px] text-gray-500 leading-snug">
                  Each approved study note or PYQ you contribute
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-1">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Unlock className="w-4 h-4" />
                </div>
                <div className="font-bold text-gray-900 text-xs">Unlock Hub</div>
                <div className="text-[11px] text-gray-500 leading-snug">
                  Unlocked files remain permanent forever with zero re-spend
                </div>
              </div>
            </div>
          </div>

          {/* Impact Stats Footer */}
          <div className="p-3 bg-gray-50/80 border border-gray-200/70 rounded-xl flex items-center justify-around text-center text-xs text-gray-600">
            <div>
              <span className="font-bold text-gray-900 text-sm block">
                {rewardsData.referralCount}
              </span>
              <span className="text-[11px] text-gray-500">Friends Invited</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="font-bold text-gray-900 text-sm block">
                {rewardsData.unlockedCount}
              </span>
              <span className="text-[11px] text-gray-500">Files Unlocked</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="font-bold text-emerald-700 text-sm block flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </span>
              <span className="text-[11px] text-gray-500">College Vault</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200/80 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200/70 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
