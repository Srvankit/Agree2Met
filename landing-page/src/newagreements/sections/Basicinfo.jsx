export default function BasicInfo() {
  return (
    <>
      {/* LEFT SIDE */}
      <div>
        <h2>Agreement Details</h2>

        <input className="input" placeholder="Agreement Title" />

        <select className="input">
          <option>Select Agreement Type</option>
          <option>Freelance</option>
          <option>Service</option>
        </select>

        <h3>Parties Involved</h3>

        <div className="party-container">

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
          className="input"
          placeholder="Agreement Description"
        />
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="side-image">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" />
      </div>
    </>
  );
}