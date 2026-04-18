import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

// Landing Components
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import AuthModal from "./components/Auth/AuthModel";

// Sections
import Hero from "./sections/hero/Hero";
import Features from "./sections/features/Features";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import Preview from "./sections/preview/Preview";
import Testimonials from "./sections/testimonials/Testimonials";

// Dashboard
import DashboardLayout from "./dashboard/dashboardLayout/DashboardLayout";

const App = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      {/* ✅ ROUTES */}
      <Routes>

        {/* 🌐 LANDING PAGE */}
        <Route
          path="/"
          element={
            <>
              <Navbar openAuth={() => setAuthOpen(true)} /> {/* 🔥 IMPORTANT */}

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
        <Route path="/dashboard" element={<DashboardLayout />} />

      </Routes>

      {/* ✅ GLOBAL AUTH MODAL */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
};

export default App;