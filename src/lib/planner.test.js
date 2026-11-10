import { describe, expect, it } from 'vitest';
import {
  createItem,
  firstStepFor,
  loadItems,
  MAX_ITEM_LENGTH,
  planMonday,
  saveItems,
  STORAGE_KEY,
} from './planner.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    data,
  };
}

describe('firstStepFor', () => {
  it.each([
    ['Learn guitar', 'Watch one 10-minute beginner lesson'],
    ['Call grandma', 'Send a quick message to pick a time'],
    ['Fix that shelf', "Gather the tools you'll need in one spot"],
    ['Finish that book', 'Read the first 10 pages'],
    ['Declutter the garage', 'Set a 10-minute timer and start with one corner'],
    ['Start running', 'Spend 5 minutes on the very first part'],
    ['Go for a run', 'Do a 10-minute version, just once'],
    ['Plan a trip to Lisbon', 'Spend 10 minutes listing three options'],
    ['Repot the plants', 'Buy or find the soil and pots'],
    ['Something else entirely', 'Spend 5 minutes on the very first part'],
  ])('%s → %s', (text, step) => {
    expect(firstStepFor(text)).toBe(step);
  });
});

describe('createItem', () => {
  it('trims, collapses whitespace and caps length', () => {
    expect(createItem('  learn   guitar ').text).toBe('learn guitar');
    expect(createItem('x'.repeat(200)).text).toHaveLength(MAX_ITEM_LENGTH);
  });

  it('rejects empty text', () => {
    expect(createItem('   ')).toBeNull();
  });

  it('creates unique ids', () => {
    expect(createItem('a').id).not.toBe(createItem('a').id);
  });
});

describe('planMonday', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map(createItem);

  it('plans the oldest items, up to the plan size', () => {
    const planned = planMonday(items, 3);
    expect(planned.map((i) => Boolean(i.step))).toEqual([true, true, true, false, false]);
  });

  it('only fills open slots; finished steps free up room', () => {
    let planned = planMonday(items, 3);
    expect(planMonday(planned, 3)).toEqual(planned);

    planned = planned.map((item, i) => (i === 0 ? { ...item, done: true } : item));
    const next = planMonday(planned, 3);
    expect(next[3].step).toBeTruthy();
    expect(next[4].step).toBeNull();
  });

  it('does not mutate its input', () => {
    planMonday(items, 3);
    expect(items.every((i) => i.step === null)).toBe(true);
  });
});

describe('persistence', () => {
  it('round-trips items', () => {
    const storage = memoryStorage();
    const items = planMonday([createItem('Learn guitar'), createItem('Call grandma')], 1);
    saveItems(items, storage);
    expect(loadItems(storage)).toEqual(items);
  });

  it('ignores junk and malformed entries', () => {
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: 'not json' }))).toEqual([]);
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
    const stored = JSON.stringify([null, { id: 1, text: 'x' }, { id: 'ok', text: 'keep', done: 'yes' }]);
    expect(loadItems(memoryStorage({ [STORAGE_KEY]: stored }))).toEqual([
      { id: 'ok', text: 'keep', step: null, done: false },
    ]);
  });

  it('survives missing or failing storage', () => {
    expect(loadItems(undefined)).toEqual([]);
    const failing = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('full');
      },
    };
    expect(loadItems(failing)).toEqual([]);
    expect(() => saveItems([], failing)).not.toThrow();
  });
});
