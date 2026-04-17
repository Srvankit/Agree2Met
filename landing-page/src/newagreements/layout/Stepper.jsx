import "../../styles/stepper.css";

export default function Stepper({ step }) {
  return (
    <div className="stepper">
      <div className={step === 0 ? "step active" : "step"}>
        1. Agreement Details
      </div>
      <div className={step === 1 ? "step active" : "step"}>
        2. Terms & Conditions
      </div>
      <div className={step === 2 ? "step active" : "step"}>
        3. Review & Sign
      </div>
    </div>
  );
}