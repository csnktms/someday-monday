import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockFetch(status, body) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  );
}

function signUp(email) {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Get early access' }));
}

describe('App', () => {
  it('renders all landing page sections', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/into an actual day/);
    expect(screen.getByRole('heading', { name: 'Small steps, real progress' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
    expect(screen.getByText(/Made for procrastinators/).textContent).toContain(
      String(new Date().getFullYear())
    );
  });

  it('signs up and shows the signup number', async () => {
    const fetchMock = mockFetch(201, { ok: true, count: 7 });
    render(<App />);
    signUp('me@example.com');

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        "Thanks! You're signup #7. We'll let you know at me@example.com when we launch."
      )
    );
    expect(fetchMock).toHaveBeenCalledWith('api/signup', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'me@example.com' });
    expect(screen.getByLabelText('Email address').value).toBe('');
  });

  it('shows the server error and keeps the email', async () => {
    mockFetch(400, { error: 'Please enter a valid email address.' });
    render(<App />);
    signUp('me@example.com');

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Please enter a valid email address.')
    );
    expect(screen.getByLabelText('Email address').value).toBe('me@example.com');
  });

  it('handles network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    render(<App />);
    signUp('me@example.com');

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe("Couldn't reach the server. Please try again."));
    expect(screen.getByRole('button', { name: 'Get early access' }).disabled).toBe(false);
  });
});
