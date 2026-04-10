import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Landing Components
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";

// Sections
import Hero from "./sections/hero/Hero";
import Features from "./sections/features/Features";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import Preview from "./sections/preview/Preview";
import Testimonials from "./sections/testimonials/Testimonials";

// Temporary Dashboard Page
const Dashboard = () => {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard UI</h1>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>

        {/* 🌐 LANDING PAGE */}
        <Route
          path="/"
          element={
            <>
              <Navbar />

              <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Preview />
                <Testimonials />
              </main>

              <Footer />
            </>
          }
        />

        {/* 📊 DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
    </Router>
  );
};

export default App;