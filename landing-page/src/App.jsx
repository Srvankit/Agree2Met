import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

// Landing Components
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import AuthModal from "./components/Auth/AuthModel";

<<<<<<< HEAD
// Sections (correct paths)
=======
// Sections
>>>>>>> 941c32dfebc0a2c4360c5eecdc15d1c758d84782
import Hero from "./sections/hero/Hero";
import Features from "./sections/features/Features";
import HowItWorks from "./sections/howItWorks/HowItWorks";
import Preview from "./sections/preview/Preview";
import Testimonials from "./sections/testimonials/Testimonials";

<<<<<<< HEAD
=======
// Dashboard
import DashboardLayout from "./dashboard/dashboardLayout/DashboardLayout";
>>>>>>> 941c32dfebc0a2c4360c5eecdc15d1c758d84782

const App = () => {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      {/* ✅ ROUTES */}
      <Routes>

<<<<<<< HEAD

      <main>
=======
        {/* 🌐 LANDING PAGE */}
        <Route
          path="/"
          element={
            <>
              <Navbar openAuth={() => setAuthOpen(true)} /> {/* 🔥 IMPORTANT */}
>>>>>>> 941c32dfebc0a2c4360c5eecdc15d1c758d84782

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

<<<<<<< HEAD
        {/* 👀 PREVIEW */}
        <Preview />

        {/* 💬 TESTIMONIALS */}
        <Testimonials />


      </main>

      <Footer />
=======
      {/* ✅ GLOBAL AUTH MODAL */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
>>>>>>> 941c32dfebc0a2c4360c5eecdc15d1c758d84782
    </>
  );
};

export default App;