import React from "react";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Home from "./pages/Home";   // ✅ added

const App = () => {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "80vh" }}>
        
        {/* 🔥 Your Hero Section */}
        <Home />

        {/* Existing content (kept unchanged) */}
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Welcome to AutoTrust
        </h1>

      </main>

      <Footer />
    </>
  );
};

export default App;