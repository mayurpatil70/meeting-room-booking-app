import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Schedule Filter State (F1)
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Booking Form State (F2)
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Search Availability State (F4)
  const [searchDate, setSearchDate] = useState("");
  const [searchStart, setSearchStart] = useState("");
  const [searchEnd, setSearchEnd] = useState("");
  const [searchMinCap, setSearchMinCap] = useState(1);

  // Initial Data
  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchBookings(scheduleDate);
  }, [scheduleDate]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`);
      if (res.ok) setRooms(await res.json());
    } catch (err) {
      setError("Cannot connect to backend server.");
    }
  };

  const fetchBookings = async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings?date=${date}`);
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Availability Search (F4)
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${API_URL}/availability?date=${searchDate}&start=${searchStart}&end=${searchEnd}&minCapacity=${searchMinCap}`,
      );
      if (res.ok) setAvailableRooms(await res.json());
    } catch (err) {
      setError("Search failed.");
    }
  };

  // Create Booking (F2)
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      roomId,
      title,
      organizerEmail,
      attendees: Number(attendees),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    };

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Validation Error");
        return;
      }

      fetchBookings(scheduleDate);
      alert("Booking Confirmed!");
    } catch (err) {
      setError("Failed to create booking.");
    }
  };

  // Cancel Booking (F3)
  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchBookings(scheduleDate);
    } catch (err) {
      setError("Failed to cancel.");
    }
  };

  // --- STYLES ---
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "system-ui, sans-serif",
      color: "#333",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "20px",
      marginTop: "20px",
    },
    card: {
      background: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    input: {
      display: "block",
      width: "90%",
      padding: "8px",
      marginBottom: "12px",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    btn: {
      background: "#0056b3",
      color: "white",
      padding: "10px 15px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      width: "100%",
    },
    error: {
      background: "#fee",
      color: "#c00",
      padding: "10px",
      borderRadius: "4px",
      marginBottom: "15px",
      border: "1px solid #fcc",
    },
    bookingItem: {
      borderLeft: "4px solid #0056b3",
      padding: "10px",
      background: "#f8f9fa",
      marginBottom: "10px",
      borderRadius: "0 4px 4px 0",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        🏢 Meeting Room System (UTC)
      </h1>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={styles.grid}>
        {/* F4: AVAILABILITY SEARCH */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>🔍 Find a Room (F4)</h3>
          <form onSubmit={handleSearch}>
            <label>Date (YYYY-MM-DD):</label>
            <input
              type="date"
              required
              style={styles.input}
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />

            <label>Start Time (HH:MM):</label>
            <input
              type="time"
              required
              style={styles.input}
              value={searchStart}
              onChange={(e) => setSearchStart(e.target.value)}
            />

            <label>End Time (HH:MM):</label>
            <input
              type="time"
              required
              style={styles.input}
              value={searchEnd}
              onChange={(e) => setSearchEnd(e.target.value)}
            />

            <label>Min Capacity:</label>
            <input
              type="number"
              min="1"
              required
              style={styles.input}
              value={searchMinCap}
              onChange={(e) => setSearchMinCap(e.target.value)}
            />

            <button type="submit" style={styles.btn}>
              Search Availability
            </button>
          </form>

          {availableRooms.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <strong>Available:</strong>
              <ul style={{ paddingLeft: "20px" }}>
                {availableRooms.map((r) => (
                  <li key={r.id}>
                    {r.name} (Cap: {r.capacity})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* F2: CREATE BOOKING */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>📅 Book a Room (F2)</h3>
          <form onSubmit={handleCreateBooking}>
            <select
              required
              style={styles.input}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Select Room...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Title"
              required
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="email"
              placeholder="Organizer Email"
              required
              style={styles.input}
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
            />
            <input
              type="number"
              min="1"
              placeholder="Attendees"
              required
              style={styles.input}
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />

            <label>Start (UTC):</label>
            <input
              type="datetime-local"
              required
              style={styles.input}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />

            <label>End (UTC):</label>
            <input
              type="datetime-local"
              required
              style={styles.input}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />

            <button
              type="submit"
              style={{ ...styles.btn, background: "#28a745" }}
            >
              Confirm Booking
            </button>
          </form>
        </div>

        {/* F1: SCHEDULE VIEW */}
        <div style={styles.card}>
          <h3
            style={{
              marginTop: 0,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>📆 Schedule (F1)</span>
            <input
              type="date"
              style={{ padding: "4px", fontSize: "14px" }}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </h3>

          {loading ? (
            <p>Loading...</p>
          ) : bookings.length === 0 ? (
            <p>No bookings for this day.</p>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {bookings.map((b) => (
                <div key={b.id} style={styles.bookingItem}>
                  <strong>{b.roomName}</strong> - {b.title} ({b.attendees} pp)
                  <br />
                  <small style={{ color: "#555" }}>
                    {new Date(b.start).toLocaleTimeString("en-US", {
                      timeZone: "UTC",
                    })}{" "}
                    -
                    {new Date(b.end).toLocaleTimeString("en-US", {
                      timeZone: "UTC",
                    })}{" "}
                    (UTC)
                  </small>
                  <br />
                  <button
                    onClick={() => handleCancel(b.id)}
                    style={{
                      marginTop: "5px",
                      color: "#c00",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
