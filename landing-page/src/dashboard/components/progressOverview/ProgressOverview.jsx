import "./progressOverview.css";

const ProgressOverview = () => {
  return (
    <div className="progress-card">

      {/* LEFT SIDE */}
      <div className="progress-left">
        <div className="circle">
          <div className="inner">
            <h2>41%</h2>
            <p>Agreements Completed</p>
          </div>
        </div>
      </div>
    
      {/* RIGHT SIDE */}
      <div className="progress-right">

        {/* Completed */}
        <div className="progress-item">
          <div className="progress-header">
            <span className="dot green"></span>
            <span>Completed</span>
            <span className="count">10 Agreements</span>
          </div>
          <div className="progress-bar">
            <div className="fill green" style={{ width: "41%" }}></div>
          </div>
        </div>

        {/* Running */}
        <div className="progress-item">
          <div className="progress-header">
            <span className="dot blue"></span>
            <span>Running</span>
            <span className="count">12 Agreements</span>
          </div>
          <div className="progress-bar">
            <div className="fill blue" style={{ width: "60%" }}></div>
          </div>
        </div>

        {/* Pending */}
        <div className="progress-item">
          <div className="progress-header">
            <span className="dot orange"></span>
            <span>Pending</span>
            <span className="count">2 Agreements</span>
          </div>
          <div className="progress-bar">
            <div className="fill orange" style={{ width: "20%" }}></div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProgressOverview;