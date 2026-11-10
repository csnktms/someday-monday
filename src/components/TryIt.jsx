import { useEffect, useState } from 'react';
import {
  createItem,
  loadItems,
  MAX_ITEM_LENGTH,
  PLAN_SIZE,
  planMonday,
  saveItems,
} from '../lib/planner.js';

const EXAMPLES = ['Learn guitar', 'Call grandma', 'Fix that shelf', 'Read that book'];

export default function TryIt() {
  const [items, setItems] = useState(() => loadItems());
  const [draft, setDraft] = useState('');

  useEffect(() => saveItems(items), [items]);

  const someday = items.filter((item) => !item.step);
  const monday = items.filter((item) => item.step);
  const doneCount = monday.filter((item) => item.done).length;
  const planIsFull = monday.length - doneCount >= PLAN_SIZE;

  function add(text) {
    const item = createItem(text);
    if (!item) return;
    setItems((prev) => [...prev, item]);
    setDraft('');
  }

  const remove = (id) => setItems((prev) => prev.filter((item) => item.id !== id));
  const toggle = (id) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  const clearDone = () => setItems((prev) => prev.filter((item) => !item.done));

  return (
    <section id="try" className="try">
      <div className="wrap">
        <h2>Try it now</h2>
        <p className="section-lead">
          Add a few things you keep meaning to do, then let Monday pick where to start.
        </p>

        <div className="try-grid">
          <div className="panel">
            <h3>Your someday list</h3>
            <form
              className="add-form"
              onSubmit={(e) => {
                e.preventDefault();
                add(draft);
              }}
            >
              <input
                type="text"
                value={draft}
                maxLength={MAX_ITEM_LENGTH}
                placeholder="Someday I'll…"
                aria-label="Something you'll do someday"
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-small" type="submit" disabled={!draft.trim()}>
                Add
              </button>
            </form>

            {someday.length === 0 ? (
              <div className="empty">
                <p>Nothing waiting. Need ideas?</p>
                <div className="chips">
                  {EXAMPLES.map((example) => (
                    <button key={example} type="button" className="chip" onClick={() => add(example)}>
                      + {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="item-list" aria-label="Someday list">
                {someday.map((item) => (
                  <li key={item.id}>
                    <span>{item.text}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${item.text}`}
                      onClick={() => remove(item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="btn plan-btn"
              disabled={someday.length === 0 || planIsFull}
              onClick={() => setItems((prev) => planMonday(prev))}
            >
              Plan my Monday →
            </button>
            {planIsFull && someday.length > 0 && (
              <p className="hint">Monday is full. Tick off a step to make room.</p>
            )}
          </div>

          <div className="panel panel-monday">
            <h3>This Monday</h3>
            {monday.length === 0 ? (
              <p className="empty">Your first small steps will show up here.</p>
            ) : (
              <>
                <p className="progress" role="status">
                  {doneCount} of {monday.length} done
                  {doneCount === monday.length ? '. Someday happened! 🎉' : ''}
                </p>
                <ul className="item-list plan-list" aria-label="This Monday">
                  {monday.map((item) => (
                    <li key={item.id} className={item.done ? 'done' : ''}>
                      <label>
                        <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
                        <span>
                          <strong>{item.step}</strong>
                          <small>for “{item.text}”</small>
                        </span>
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Remove ${item.text}`}
                        onClick={() => remove(item.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {doneCount > 0 && (
                  <button type="button" className="link-btn" onClick={clearDone}>
                    Clear finished
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
