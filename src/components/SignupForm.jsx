import { useEffect, useState } from 'react';
import ReferralCard from './ReferralCard.jsx';
import { fetchReferral, loadSavedCode, refFromUrl, saveCode } from '../lib/referral.js';

const DEFAULT_NOTE = 'No spam. Just one email when we launch.';
const INVITED_NOTE = 'A friend invited you. Join and you’ll give them a boost up the list.';

export async function submitSignup(email, ref) {
  let res;
  try {
    res = await fetch('api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ref ? { email, ref } : { email }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Please try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export async function fetchSignupCount(signal) {
  const res = await fetch('api/signups', { signal });
  if (!res.ok) throw new Error('Could not load signup count');
  const { count } = await res.json();
  return Number.isInteger(count) ? count : 0;
}

export function socialProof(count) {
  if (!count) return null;
  return count === 1
    ? '1 person is already on the early-access list.'
    : `${count} people are already on the early-access list.`;
}

export default function SignupForm() {
  const [ref] = useState(() => refFromUrl());
  const [email, setEmail] = useState('');
  const [note, setNote] = useState(ref ? INVITED_NOTE : DEFAULT_NOTE);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSignupCount(controller.signal)
      .then(setCount)
      .catch(() => {}); // The counter is a nice-to-have; hide it on errors.

    // Returning visitors who already signed up see their link and current spot.
    const savedCode = loadSavedCode();
    if (savedCode) {
      fetchReferral(savedCode, controller.signal)
        .then((stats) => {
          if (stats) setReferral(stats);
          else saveCode(null); // The demo server restarted and forgot this signup.
        })
        .catch(() => {});
    }
    return () => controller.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await submitSignup(email, ref);
      setCount((prev) => Math.max(prev, data.count));
      if (data.code) {
        saveCode(data.code);
        setReferral({ code: data.code, spot: data.spot, referrals: data.referrals });
      }
      setNote(`Thanks! You're signup #${data.count}. We'll let you know at ${email} when we launch.`);
      setEmail('');
    } catch (err) {
      setNote(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="signup" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="you@example.com"
          aria-label="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Joining…' : 'Get early access'}
        </button>
      </form>
      <div className="note" role="status">
        {note}
      </div>
      {socialProof(count) && <p className="social-proof">{socialProof(count)}</p>}
      {referral && <ReferralCard stats={referral} />}
    </>
  );
}
