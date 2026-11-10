import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Mock fetch per route: { 'api/signups': [200, {...}], 'api/signup': [201, {...}] } */
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

describe('App', () => {
  it('renders all landing page sections', () => {
    mockApi({ 'api/signups': [200, { count: 0 }] });
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/into an actual day/);
    for (const name of ['Small steps, real progress', 'How it works', 'Try it now', 'Questions']) {
      expect(screen.getByRole('heading', { name })).toBeTruthy();
    }
    expect(screen.getByRole('link', { name: 'Try it' }).getAttribute('href')).toBe('#try');
    expect(screen.getByRole('link', { name: 'FAQ' }).getAttribute('href')).toBe('#faq');
    expect(screen.getByText('What if I skip a week?')).toBeTruthy();
    expect(screen.getByText(/Made for procrastinators/).textContent).toContain(
      String(new Date().getFullYear())
    );
  });

  it('shows how many people have signed up', async () => {
    mockApi({ 'api/signups': [200, { count: 12 }] });
    render(<App />);
    expect(await screen.findByText('12 people are already on the early-access list.')).toBeTruthy();
  });

  it('hides the counter when nobody has signed up or it fails to load', async () => {
    mockApi({ 'api/signups': [500, {}] });
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('api/signups', expect.anything()));
    expect(screen.queryByText(/already on the early-access list/)).toBeNull();
  });

  it('signs up, shows the signup number and updates the counter', async () => {
    const fetchMock = mockApi({
      'api/signups': [200, { count: 6 }],
      'api/signup': [201, { ok: true, count: 7 }],
    });
    render(<App />);
    await screen.findByText('6 people are already on the early-access list.');
    signUp('me@example.com');

    await waitFor(() =>
      expect(screen.getByRole('status', { name: '' }).textContent).toBe(
        "Thanks! You're signup #7. We'll let you know at me@example.com when we launch."
      )
    );
    expect(screen.getByText('7 people are already on the early-access list.')).toBeTruthy();
    const [, options] = fetchMock.mock.calls.find(([url]) => url === 'api/signup');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'me@example.com' });
    expect(screen.getByLabelText('Email address').value).toBe('');
  });

  it('shows the server error and keeps the email', async () => {
    mockApi({
      'api/signups': [200, { count: 0 }],
      'api/signup': [400, { error: 'Please enter a valid email address.' }],
    });
    render(<App />);
    signUp('me@example.com');

    await waitFor(() =>
      expect(screen.getByText('Please enter a valid email address.')).toBeTruthy()
    );
    expect(screen.getByLabelText('Email address').value).toBe('me@example.com');
  });

  it('handles network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    render(<App />);
    signUp('me@example.com');

    await waitFor(() =>
      expect(screen.getByText("Couldn't reach the server. Please try again.")).toBeTruthy()
    );
    expect(screen.getByRole('button', { name: 'Get early access' }).disabled).toBe(false);
  });
});
