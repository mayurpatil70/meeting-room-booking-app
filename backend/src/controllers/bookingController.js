import { pool } from "../db.js";
import { validateBookingTimes } from "../utils/validators.js"; // Make sure your file is named validators.js, or change this to match your setup!

export const createBooking = async (req, res) => {
  const { roomId, title, organizerEmail, attendees, start, end } = req.body;

  // 1. Enforce Rules R1-R5 (Pure time validation)
  const timeValidation = validateBookingTimes(start, end);
  if (!timeValidation.isValid) {
    return res.status(400).json({
      error: { code: "INVALID_TIME", message: timeValidation.error },
    });
  }

  try {
    // 2. Enforce Rule R6 (Room existence and capacity check)
    const roomRes = await pool.query(
      "SELECT capacity FROM rooms WHERE id = $1",
      [roomId],
    );
    if (roomRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room does not exist" },
      });
    }

    if (attendees > roomRes.rows[0].capacity) {
      return res.status(400).json({
        error: {
          code: "CAPACITY_EXCEEDED",
          message: "Attendees exceed room capacity (R6)",
        },
      });
    }

    // 3. Insert and rely on PostgreSQL GiST constraint for Concurrency (R7)
    const insertQuery = `
      INSERT INTO bookings (room_id, title, organizer_email, attendees, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, room_id AS "roomId", title, organizer_email AS "organizerEmail", attendees, start_time AS start, end_time AS end, status, created_at AS "createdAt";
    `;

    const newBooking = await pool.query(insertQuery, [
      roomId,
      title,
      organizerEmail,
      attendees,
      start,
      end,
    ]);
    return res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    if (err.code === "23P01") {
      return res.status(409).json({
        error: {
          code: "BOOKING_CONFLICT",
          message: "The room is already booked for this time slot.",
        },
      });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getRooms = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch rooms" });
  }
};

export const getBookings = async (req, res) => {
  const { date, roomId } = req.query;
  try {
    let query = `
      SELECT b.id, b.room_id AS "roomId", r.name AS "roomName", b.title, 
             b.organizer_email AS "organizerEmail", b.attendees, 
             b.start_time AS "start", b.end_time AS "end", b.status
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status = 'confirmed'
    `;
    const params = [];

    if (date) {
      params.push(date);
      query += ` AND DATE(b.start_time AT TIME ZONE 'UTC') = $${params.length}`;
    }
    if (roomId) {
      params.push(roomId);
      query += ` AND b.room_id = $${params.length}`;
    }

    query += ` ORDER BY b.start_time ASC`;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query("SELECT * FROM bookings WHERE id = $1", [
      id,
    ]);
    if (check.rows.length === 0) {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Booking not found" } });
    }

    const booking = check.rows[0];
    if (new Date(booking.start_time) < new Date()) {
      return res
        .status(400)
        .json({
          error: {
            code: "ALREADY_STARTED",
            message: "Cannot cancel a booking that has already started",
          },
        });
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [
      id,
    ]);
    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
};

export const getAvailability = async (req, res) => {
  const { date, start, end, minCapacity = 1 } = req.query;
  try {
    const fullStart = `${date}T${start}:00Z`;
    const fullEnd = `${date}T${end}:00Z`;

    const query = `
      SELECT r.* FROM rooms r
      WHERE r.capacity >= $1
      AND r.id NOT IN (
        SELECT room_id FROM bookings
        WHERE status = 'confirmed'
        AND tstzrange(start_time, end_time) && tstzrange($2::timestamptz, $3::timestamptz)
      )
      ORDER BY r.capacity ASC;
    `;
    const result = await pool.query(query, [minCapacity, fullStart, fullEnd]);
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Failed to search availability" });
  }
};
