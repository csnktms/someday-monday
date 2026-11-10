import { useEffect, useState } from 'react';

const DEFAULT_NOTE = 'No spam. Just one email when we launch.';

export async function submitSignup(email) {
  let res;
  try {
    res = await fetch('api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
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
  const [email, setEmail] = useState('');
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchSignupCount(controller.signal)
      .then(setCount)
      .catch(() => {}); // The counter is a nice-to-have; hide it on errors.
    return () => controller.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = await submitSignup(email);
      setCount((prev) => Math.max(prev, data.count));
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
    </>
  );
}
