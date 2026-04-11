import "./sidebar.css";
import { useState } from "react";

const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="hamburger" onClick={() => setOpen(!open)}>☰</div>

      <div className={`sidebar ${open ? "open" : "closed"}`}>
        <h2>Agree2Met</h2>

        <ul>
          <li className="active">Dashboard</li>
          <li>Tasks</li>
          <li>Calendar</li>
          <li>Analytics</li>
          <li>Team</li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;