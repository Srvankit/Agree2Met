import React from "react";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";

// Pages
import Home from "./pages/Home";

// Sections
import Features from "./components/Features/Features";
import HowItWorks from "./components/HowItWorks/HowItWorks";

const App = () => {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "80vh" }}>

        {/* 🔥 HERO SECTION */}
        <Home />

        {/* 🚀 FEATURES SECTION */}
        <Features />

        {/* ⚙️ HOW IT WORKS SECTION */}
        <HowItWorks />

      </main>


        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Welcome to AutoTrust
        </h1>

      <Footer />
    </>
  );
};

export default App;