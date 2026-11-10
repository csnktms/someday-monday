const features = [
  {
    icon: '📥',
    title: 'Dump your somedays',
    text: 'Capture every “I should really…” in seconds. No categories, no guilt.',
  },
  {
    icon: '🗓️',
    title: 'A gentle Monday plan',
    text: 'Every Monday you get a short, realistic list that fits around your actual schedule.',
  },
  {
    icon: '🌱',
    title: 'Tiny first steps',
    text: 'Big goals become five-minute starts, so getting going never feels heavy.',
  },
];

export default function Features() {
  return (
    <section id="features">
      <div className="wrap">
        <h2>Small steps, real progress</h2>
        <div className="features">
          {features.map((f) => (
            <div className="card" key={f.title}>
              <div className="icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
