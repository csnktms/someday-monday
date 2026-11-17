import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App.jsx';
import { getInitialTheme } from '../lib/theme.js';
import { friendsLine, referralLink, refFromUrl } from '../lib/referral.js';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockApi(routes) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const route = routes[url];
    if (!route) throw new TypeError('Failed to fetch');
    return json(...route);
  });
}

function signUp(email) {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Get early access' }));
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('dark mode', () => {
  it('starts light and toggles to dark, remembering the choice', () => {
    mockApi({ 'api/signups': [200, { count: 0 }] });
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('sm-theme')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('sm-theme')).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('sm-theme')).toBe('light');
  });

  it('uses the saved theme on load', () => {
    localStorage.setItem('sm-theme', 'dark');
    mockApi({ 'api/signups': [200, { count: 0 }] });
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
  });

  it('follows the device setting when nothing is saved', () => {
    vi.stubGlobal('matchMedia', (q) => ({ matches: q === '(prefers-color-scheme: dark)' }));
    expect(getInitialTheme()).toBe('dark');
    localStorage.setItem('sm-theme', 'light');
    expect(getInitialTheme()).toBe('light');
    localStorage.setItem('sm-theme', 'purple');
    expect(getInitialTheme()).toBe('dark');
  });
});

describe('referral link', () => {
  it('shows the spot and a copyable link after signing up', async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    mockApi({
      'api/signups': [200, { count: 4 }],
      'api/signup': [201, { ok: true, count: 5, code: 'abc123XY', position: 5, referrals: 0, spot: 5 }],
    });
    render(<App />);
    signUp('me@example.com');

    expect((await screen.findByText(/on the list/)).textContent).toBe("You're #5 on the list");
    const link = screen.getByLabelText('Your referral link');
    expect(link.value).toBe(`${window.location.origin}/?ref=abc123XY`);
    expect(screen.getByText(/No friends have joined yet/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('sm-signup'))).toEqual({ code: 'abc123XY' });

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(await screen.findByText('Link copied!')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(link.value);
  });

  it('sends the ref code from a shared link and says a friend invited you', async () => {
    window.history.replaceState(null, '', '/?ref=friendCode');
    const fetchMock = mockApi({
      'api/signups': [200, { count: 1 }],
      'api/signup': [201, { ok: true, count: 2, code: 'newCode1', position: 2, referrals: 0, spot: 2 }],
    });
    render(<App />);
    expect(screen.getByText(/A friend invited you/)).toBeTruthy();
    signUp('pal@example.com');

    await screen.findByText(/on the list/);
    const [, options] = fetchMock.mock.calls.find(([url]) => url === 'api/signup');
    expect(JSON.parse(options.body)).toEqual({ email: 'pal@example.com', ref: 'friendCode' });
    // The visitor's own link doesn't carry the friend's code.
    expect(screen.getByLabelText('Your referral link').value).toMatch(/\?ref=newCode1$/);
  });

  it('shows a returning visitor their current spot', async () => {
    localStorage.setItem('sm-signup', JSON.stringify({ code: 'saved123' }));
    mockApi({
      'api/signups': [200, { count: 9 }],
      'api/referral/saved123': [200, { code: 'saved123', position: 7, referrals: 3, spot: 4 }],
    });
    render(<App />);
    expect((await screen.findByText(/on the list/)).textContent).toBe("You're #4 on the list");
    expect(screen.getByText(/3 friends have joined with your link/)).toBeTruthy();
  });

  it('forgets a saved code the server no longer knows', async () => {
    localStorage.setItem('sm-signup', JSON.stringify({ code: 'gone1234' }));
    mockApi({
      'api/signups': [200, { count: 0 }],
      'api/referral/gone1234': [404, { error: 'Unknown referral code' }],
    });
    render(<App />);
    await waitFor(() => expect(localStorage.getItem('sm-signup')).toBeNull());
    expect(screen.queryByText(/on the list/)).toBeNull();
  });

  it('helpers validate codes and build links', () => {
    expect(refFromUrl('?ref=ok_code-1')).toBe('ok_code-1');
    expect(refFromUrl('?ref=<script>')).toBeNull();
    expect(refFromUrl('')).toBeNull();
    expect(
      referralLink('abc', { origin: 'https://x.dev', pathname: '/demo/' })
    ).toBe('https://x.dev/demo/?ref=abc');
    expect(friendsLine(1)).toBe('1 friend has joined with your link.');
  });
});
