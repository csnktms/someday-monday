export const SIGNUP_KEY = 'sm-signup';

/** The ?ref= code from a shared link, if it looks valid. */
export function refFromUrl(search = window.location.search) {
  const ref = new URLSearchParams(search).get('ref');
  return ref && /^[A-Za-z0-9_-]{1,32}$/.test(ref) ? ref : null;
}

/** The link to share: this page with ?ref=<code>, without any other query or hash. */
export function referralLink(code, location = window.location) {
  return `${location.origin}${location.pathname}?ref=${encodeURIComponent(code)}`;
}

export function loadSavedCode() {
  try {
    return JSON.parse(localStorage.getItem(SIGNUP_KEY))?.code || null;
  } catch {
    return null;
  }
}

export function saveCode(code) {
  try {
    if (code) localStorage.setItem(SIGNUP_KEY, JSON.stringify({ code }));
    else localStorage.removeItem(SIGNUP_KEY);
  } catch {
    // Storage blocked: the card still shows for this visit.
  }
}

export async function fetchReferral(code, signal) {
  const res = await fetch(`api/referral/${encodeURIComponent(code)}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load referral stats');
  return res.json();
}

export function friendsLine(referrals) {
  if (!referrals) return 'No friends have joined yet.';
  return referrals === 1 ? '1 friend has joined with your link.' : `${referrals} friends have joined with your link.`;
}
