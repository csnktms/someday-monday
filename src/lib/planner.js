// Logic behind the "Try it" demo: turn someday items into small first steps.

export const MAX_ITEM_LENGTH = 80;
export const PLAN_SIZE = 3;

const RULES = [
  [/\b(learn|practi[cs]e|study)\b/i, 'Watch one 10-minute beginner lesson'],
  [/\b(call|text|email|write to|visit)\b/i, 'Send a quick message to pick a time'],
  [/\b(fix|repair|paint|build|assemble)\b/i, "Gather the tools you'll need in one spot"],
  [/\b(read|finish)\b.*\bbook\b|\bread\b/i, 'Read the first 10 pages'],
  [/\b(clean|tidy|declutter|organi[sz]e|sort)\b/i, 'Set a 10-minute timer and start with one corner'],
  [/\b(run|exercise|gym|walk|yoga|swim|stretch)\b/i, 'Do a 10-minute version, just once'],
  [/\b(cook|bake)\b/i, "Pick one recipe and check what's already in the kitchen"],
  [/\b(plan|book|trip|travel|holiday|vacation)\b/i, 'Spend 10 minutes listing three options'],
  [/\b(write|blog|journal)\b/i, 'Write one rough paragraph'],
  [/\b(repot|plant|garden)\b/i, 'Buy or find the soil and pots'],
];

const DEFAULT_STEP = 'Spend 5 minutes on the very first part';

/** A small, concrete first step for a someday item. */
export function firstStepFor(text) {
  const match = RULES.find(([pattern]) => pattern.test(text));
  return match ? match[1] : DEFAULT_STEP;
}

let nextId = 0;
function makeId() {
  nextId += 1;
  return `${Date.now().toString(36)}-${nextId}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Create a new (unplanned) item, or null if the text is empty. */
export function createItem(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_LENGTH);
  if (!clean) return null;
  return { id: makeId(), text: clean, step: null, done: false };
}

/** Give the oldest unplanned items a first step, so up to `size` items are on this Monday's plan. */
export function planMonday(items, size = PLAN_SIZE) {
  const openSlots = size - items.filter((item) => item.step && !item.done).length;
  let remaining = Math.max(0, openSlots);
  return items.map((item) => {
    if (remaining > 0 && !item.step) {
      remaining -= 1;
      return { ...item, step: firstStepFor(item.text) };
    }
    return item;
  });
}

// --- Persistence (best effort: storage can be missing, full, or hold junk) ---

export const STORAGE_KEY = 'someday-monday:demo';

export function loadItems(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string')
      .map((item) => ({
        id: item.id,
        text: item.text.slice(0, MAX_ITEM_LENGTH),
        step: typeof item.step === 'string' ? item.step : null,
        done: item.done === true,
      }));
  } catch {
    return [];
  }
}

export function saveItems(items, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore: the demo still works without persistence.
  }
}
