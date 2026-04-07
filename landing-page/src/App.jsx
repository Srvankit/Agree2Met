import React from "react";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";

// Sections (correct paths)
import Hero from "./sections/hero/Hero";
import Features from "./sections/features/Features";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import Preview from "./sections/preview/Preview";
import Testimonials from "./sections/testimonials/Testimonials";


const App = () => {
  return (
    <>
      <Navbar />


      <main>


        {/* 🔥 HERO */}
        <Hero />

        {/* 🚀 FEATURES */}
        <Features />

        {/* ⚙️ HOW IT WORKS */}
        <HowItWorks />

        {/* 👀 PREVIEW */}
        <Preview />

        {/* 💬 TESTIMONIALS */}
        <Testimonials />


      </main>

      <Footer />
    </>
  );
};

export default App;