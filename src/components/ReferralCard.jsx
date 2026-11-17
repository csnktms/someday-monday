import { useState } from 'react';
import { friendsLine, referralLink } from '../lib/referral.js';

export default function ReferralCard({ stats }) {
  const [copied, setCopied] = useState(null);
  const link = referralLink(stats.code);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('Link copied!');
    } catch {
      setCopied('Copy failed. Select the link and copy it yourself.');
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: 'Someday Monday',
        text: 'Turn "someday" into an actual day. Join the early-access list:',
        url: link,
      });
    } catch {
      // The visitor closed the share sheet; nothing to do.
    }
  }

  return (
    <div className="referral" aria-labelledby="referral-title">
      <p id="referral-title" className="referral-title">
        You're <strong>#{stats.spot}</strong> on the list
      </p>
      <p className="referral-sub">
        Share your link: every friend who joins moves you up one spot. {friendsLine(stats.referrals)}
      </p>
      <div className="referral-row">
        <input
          className="referral-link"
          readOnly
          value={link}
          aria-label="Your referral link"
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className="btn btn-small" onClick={copy}>
          Copy link
        </button>
        {canShare && (
          <button type="button" className="btn btn-small btn-ghost" onClick={share}>
            Share
          </button>
        )}
      </div>
      <p className="referral-copied" aria-live="polite">
        {copied}
      </p>
    </div>
  );
}
