import SignupForm from './SignupForm.jsx';

export default function Hero() {
  return (
    <div className="hero wrap" id="signup">
      <div className="badge">Coming soon</div>
      <h1>
        Turn <em>“someday”</em>
        <br />
        into an actual day.
      </h1>
      <p>
        Someday Monday collects the things you keep meaning to do (learn guitar, call grandma,
        fix that shelf) and slips them into your week, one small step at a time.
      </p>
      <SignupForm />
    </div>
  );
}
