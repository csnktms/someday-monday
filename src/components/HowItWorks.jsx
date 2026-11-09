const steps = [
  { title: 'Write it down', text: 'Add anything you’ve been putting off, big or small.' },
  { title: 'Wake up to Monday', text: 'We pick a few items and break them into bite-sized steps for the week.' },
  { title: 'Watch someday happen', text: 'Check things off, skip without shame, and see how far you’ve come.' },
];

export default function HowItWorks() {
  return (
    <section id="how">
      <div className="wrap">
        <h2>How it works</h2>
        <div className="steps">
          {steps.map((s) => (
            <div className="step" key={s.title}>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
