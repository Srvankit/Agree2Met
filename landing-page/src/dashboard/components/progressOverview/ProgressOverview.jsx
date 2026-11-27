import "./progressOverview.css";

const ProgressOverview = () => {
  return (
    <div className="progress-card">

      {/* HEADER */}
      <div className="progress-title">
        <h3>Agreement Progress</h3>
        <p>Track agreement completion status in real time</p>
      </div>

      {/* PROGRESS CONTENT */}
      <div className="progress-right">

        {/* Completed */}
        <div className="progress-item">
          <div className="progress-header">
            <div className="left">
              <span className="dot green"></span>
              <span>Completed</span>
            </div>

            <div className="right">
              <span className="percent">41%</span>
              <span className="count">10 Agreements</span>
            </div>
          </div>

          <div className="progress-bar">
            <div className="fill green" style={{ width: "41%" }}></div>
          </div>
        </div>

        {/* Running */}
        <div className="progress-item">
          <div className="progress-header">
            <div className="left">
              <span className="dot blue"></span>
              <span>Running</span>
            </div>

            <div className="right">
              <span className="percent">60%</span>
              <span className="count">12 Agreements</span>
            </div>
          </div>

          <div className="progress-bar">
            <div className="fill blue" style={{ width: "60%" }}></div>
          </div>
        </div>

        {/* Pending */}
        <div className="progress-item">
          <div className="progress-header">
            <div className="left">
              <span className="dot orange"></span>
              <span>Pending</span>
            </div>

            <div className="right">
              <span className="percent">20%</span>
              <span className="count">2 Agreements</span>
            </div>
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