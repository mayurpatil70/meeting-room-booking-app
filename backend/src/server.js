import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  createBooking,
  getRooms,
  getBookings,
  cancelBooking,
  getAvailability,
} from "./controllers/bookingController.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes as required by section 5.1
app.get("/api/rooms", getRooms);
app.get("/api/bookings", getBookings);
app.post("/api/bookings", createBooking);
app.delete("/api/bookings/:id", cancelBooking);
app.get("/api/availability", getAvailability);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
