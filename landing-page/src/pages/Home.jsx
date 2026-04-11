import Hero from "../sections/hero/Hero";
import Features from "../sections/features/Features";
import HowItWorks from "../sections/howItWorks/HowItWorks";
import Preview from "../sections/preview/Preview";
import Testimonials from "../sections/testimonials/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Preview />
      <Testimonials />
    </>
  );
}