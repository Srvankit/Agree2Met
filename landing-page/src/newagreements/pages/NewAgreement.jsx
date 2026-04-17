import { useState } from "react";
import "../styles/main.css";

export default function NewAgreement() {
  const [step, setStep] = useState(1);

  const handleSaveDraft = () => {
    alert("Draft Saved ✅");
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="page">
      <div className="card">

        {/* HEADER */}
        <div className="header">
          <h1>Create Agreement</h1>
        </div>

        {/* STEPPER */}
        <div className="stepper">
          <div className={step === 1 ? "step active" : "step"}>
            1. Agreement Details
          </div>
          <div className={step === 2 ? "step active" : "step"}>
            2. Terms & Conditions
          </div>
          <div className={step === 3 ? "step active" : "step"}>
            3. Review & Sign
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* LEFT SIDE */}
          <div className="form">

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h2>Agreement Details</h2>

                <input className="input" placeholder="Agreement Title" />

                <select className="input">
                  <option>Select Agreement Type</option>
                  <option>Freelance</option>
                  <option>Service</option>
                </select>

                <h3>Parties Involved</h3>

                <div className="party-row">
                  <div className="party-box">
                    <h4>👤 Party A (Client)</h4>
                    <input className="input" placeholder="Name / Company" />
                    <input className="input" placeholder="Email Address" />
                  </div>

                  <div className="party-box">
                    <h4>👤 Party B (Provider)</h4>
                    <input className="input" placeholder="Name / Company" />
                    <input className="input" placeholder="Email Address" />
                  </div>
                </div>

                <h3>Timeline</h3>

                <div className="date-row">
                  <input type="date" className="input" />
                  <input type="date" className="input" />
                </div>

                <textarea
                  className="input textarea"
                  placeholder="Agreement Description"
                />
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <h2>Terms & Conditions</h2>

                <textarea
                  className="input textarea"
                  style={{ height: "120px" }}
                  placeholder="Enter terms and conditions..."
                />
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <h2>Review & Sign</h2>
                <p style={{ fontSize: "13px" }}>
                  Review all details before submission.
                </p>
              </>
            )}

          </div>

          {/* RIGHT IMAGE */}
          <div className="image-box">
            {step === 1 && (
              <img src="https://img.freepik.com/free-vector/business-deal-concept-illustration_114360-2059.jpg" />
            )}
            {step === 2 && (
              <img src="https://img.freepik.com/free-vector/terms-conditions-concept-illustration_114360-4791.jpg" />
            )}
            {step === 3 && (
              <img src="https://img.freepik.com/free-vector/digital-signature-concept-illustration_114360-5573.jpg" />
            )}
          </div>

        </div>

        {/* ACTIONS */}
        <div className="actions">

          <button className="btn back" onClick={prevStep}>
            ← Back
          </button>

          <div className="actions-right">

            <button className="btn draft" onClick={handleSaveDraft}>
              Save Draft
            </button>

            {step < 3 ? (
              <button className="btn next" onClick={nextStep}>
                Next →
              </button>
            ) : (
              <button className="btn next">
                Finish ✔
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}