import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Features from './components/Features.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import TryIt from './components/TryIt.jsx';
import Testimonial from './components/Testimonial.jsx';
import Faq from './components/Faq.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TryIt />
        <Testimonial />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
