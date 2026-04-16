import "./remainders.css";

const ReminderCard = () => {
  return (
    <div className="reminder-card">

      {/* HEADER */}
      <div className="reminder-header">
        <h4>Reminder</h4>
        <button className="add-btn">+ Add</button>
      </div>

      {/* INNER CARD */}
      <div className="reminder-box">

        <div className="reminder-top">
          <div className="reminder-icon">📅</div>

          <div>
            <p className="reminder-title">
              Meeting with <span>Client</span>
            </p>

            <p className="reminder-time">
              Today • 02:00 PM - 04:00 PM
            </p>
          </div>
        </div>

        <button className="meeting-btn">
          🎥 Start Meeting
        </button>

      </div>

    </div>
  );
};

export default ReminderCard;