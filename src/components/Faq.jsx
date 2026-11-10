const QUESTIONS = [
  {
    q: 'Is Someday Monday free?',
    a: 'There will be a free plan that covers everything on this page. Early-access members get the extras free for the first year.',
  },
  {
    q: 'What if I skip a week?',
    a: 'Nothing happens. Your somedays wait patiently, and next Monday picks up where you left off. No streaks, no guilt.',
  },
  {
    q: 'How does it choose what goes on my Monday?',
    a: 'It starts with the things that have waited longest and keeps the list short (three items by default) so it fits into a real week.',
  },
  {
    q: 'Does it work with my calendar?',
    a: 'Calendar sync is planned for launch, so your Monday steps can land in the gaps between meetings.',
  },
  {
    q: 'What do you do with my email?',
    a: 'We send you one email when we launch. That’s it. You can ask us to delete it any time.',
  },
];

export default function Faq() {
  return (
    <section id="faq">
      <div className="wrap faq">
        <h2>Questions</h2>
        {QUESTIONS.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
