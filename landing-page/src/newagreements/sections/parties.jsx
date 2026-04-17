export default function Parties() {
  return (
    <div>
      <h2>Parties</h2>

      <div className="grid-2">
        <input placeholder="Party A Email" />
        <input placeholder="Party B Email" />
      </div>

      <div className="grid-2">
        <input placeholder="Phone" />
        <input placeholder="Address" />
      </div>
    </div>
  );
}