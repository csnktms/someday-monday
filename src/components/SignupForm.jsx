import { useState } from 'react';

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

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { count } = await submitSignup(email);
      setNote(`Thanks! You're signup #${count}. We'll let you know at ${email} when we launch.`);
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
    </>
  );
}
