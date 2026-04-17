import "../../styles/sections.css";

export default function Terms({ updateData }) {
  return (
    <div className="section glass">

      <div className="form-left">

        <h2>Terms & Conditions</h2>

        <textarea
          placeholder="Write your terms..."
          onChange={(e) => updateData({ terms: e.target.value })}
        />

        <input
          placeholder="Payment Amount"
          onChange={(e) => updateData({ amount: e.target.value })}
        />

        <textarea
          placeholder="Responsibilities"
          onChange={(e) => updateData({ resp: e.target.value })}
        />

      </div>

      <div className="form-right">
        <img src="https://illustrations.popsy.co/blue/work-from-home.svg" />
      </div>

    </div>
  );
}