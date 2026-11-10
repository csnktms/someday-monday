import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import TryIt from './TryIt.jsx';
import { STORAGE_KEY } from '../lib/planner.js';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const somedayList = () => screen.queryByRole('list', { name: 'Someday list' });
const mondayList = () => screen.queryByRole('list', { name: 'This Monday' });
const planButton = () => screen.getByRole('button', { name: 'Plan my Monday →' });

function addItem(text) {
  fireEvent.change(screen.getByLabelText("Something you'll do someday"), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
}

describe('TryIt', () => {
  it('starts empty with example chips and nothing to plan', () => {
    render(<TryIt />);
    expect(screen.getByRole('button', { name: '+ Learn guitar' })).toBeTruthy();
    expect(planButton().disabled).toBe(true);
    expect(screen.getByText('Your first small steps will show up here.')).toBeTruthy();
  });

  it('adds items by typing or from examples, and removes them', () => {
    render(<TryIt />);
    // Example chips only show while the list is empty.
    fireEvent.click(screen.getByRole('button', { name: '+ Call grandma' }));
    expect(screen.queryByRole('button', { name: '+ Learn guitar' })).toBeNull();
    addItem('Fix that shelf');

    const items = within(somedayList()).getAllByRole('listitem');
    expect(items.map((li) => li.textContent.replace('×', ''))).toEqual(['Call grandma', 'Fix that shelf']);
    expect(screen.getByLabelText("Something you'll do someday").value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Call grandma' }));
    expect(within(somedayList()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('ignores blank input', () => {
    render(<TryIt />);
    expect(screen.getByRole('button', { name: 'Add' }).disabled).toBe(true);
    addItem('   ');
    expect(somedayList()).toBeNull();
  });

  it('plans up to three items with first steps and tracks progress', () => {
    render(<TryIt />);
    ['Learn guitar', 'Call grandma', 'Fix that shelf', 'Read that book'].forEach(addItem);
    fireEvent.click(planButton());

    const monday = within(mondayList());
    expect(monday.getAllByRole('listitem')).toHaveLength(3);
    expect(monday.getByText('Watch one 10-minute beginner lesson')).toBeTruthy();
    expect(monday.getByText('for “Learn guitar”')).toBeTruthy();
    expect(within(somedayList()).getAllByRole('listitem')).toHaveLength(1);

    // Monday is full until something is done.
    expect(planButton().disabled).toBe(true);
    expect(screen.getByText('Monday is full. Tick off a step to make room.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('0 of 3 done');

    fireEvent.click(monday.getAllByRole('checkbox')[0]);
    expect(screen.getByRole('status').textContent).toBe('1 of 3 done');
    expect(planButton().disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Clear finished' }));
    expect(within(mondayList()).getAllByRole('listitem')).toHaveLength(2);
  });

  it('celebrates when everything planned is done', () => {
    render(<TryIt />);
    addItem('Call grandma');
    fireEvent.click(planButton());
    fireEvent.click(within(mondayList()).getByRole('checkbox'));
    expect(screen.getByRole('status').textContent).toBe('1 of 1 done. Someday happened! 🎉');
  });

  it('remembers the list across reloads', () => {
    const { unmount } = render(<TryIt />);
    addItem('Learn guitar');
    addItem('Call grandma');
    fireEvent.click(planButton());
    unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(2);
    render(<TryIt />);
    expect(within(mondayList()).getAllByRole('listitem')).toHaveLength(2);
  });
});
