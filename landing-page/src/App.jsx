import React from "react";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";

const App = () => {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "80vh" }}>
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Welcome to AutoTrust
        </h1>
      </main>

      <Footer />
    </>
  );
};

export default App;