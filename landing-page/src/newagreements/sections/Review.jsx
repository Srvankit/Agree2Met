import "../../styles/sections.css";

export default function Review({ data }) {
  return (
    <div className="section glass">

      <div className="form-left">

        <h2>Review & Confirm</h2>

        <p><b>Title:</b> {data.title}</p>
        <p><b>Description:</b> {data.desc}</p>
        <p><b>Amount:</b> {data.amount}</p>

      </div>

      <div className="form-right">
        <img src="https://illustrations.popsy.co/blue/digital-nomad.svg" />
      </div>

    </div>
  );
}