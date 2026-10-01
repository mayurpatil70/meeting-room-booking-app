export function validateBookingTimes(startStr, endStr, now = new Date()) {
  const start = new Date(startStr);
  const end = new Date(endStr);

  //check valid data format
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid date format." };
  }

  //R5: cannot start with past
  if (start < now) {
    return {
      isValid: false,
      error: "A booking cannot start in the past (R5).",
    };
  }

  //R1 : end must be after start
  if (end <= start) {
    return {
      isValid: false,
      error: "The end time must be after the start time (R1).",
    };
  }

  //R3 : duration must be at least 15 minutes and 4 hours
  const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationInMinutes < 15 || durationInMinutes > 240) {
    return {
      isValid: false,
      error:
        "The booking duration must be at least 15 minutes and no more than 4 hours (R3).",
    };
  }

  //R2: 15-minute boundaries and zero seconds
  if (
    start.getUTCMinutes() % 15 !== 0 ||
    end.getUTCMinutes() % 15 !== 0 ||
    start.getUTCSeconds() !== 0 ||
    end.getUTCSeconds() !== 0 ||
    start.getUTCMilliseconds() !== 0 ||
    end.getUTCMilliseconds() !== 0
  ) {
    return {
      isValid: false,
      error:
        "Bookings must be on 15-minute boundaries and have zero seconds and milliseconds (R2).",
    };
  }

  //R4 : same UTC day check
  if (
    start.getUTCFullYear() !== end.getUTCFullYear() ||
    start.getUTCMonth() !== end.getUTCMonth() ||
    start.getUTCDate() !== end.getUTCDate()
  ) {
    return {
      isValid: false,
      error: "Bookings must start and end on the same UTC day (R4).",
    };
  }

  //R4: business hours (8:00 20:00 UTC)
  const startHour = start.getUTCHours();
  const endHour = end.getUTCHours();
  const endMinute = end.getUTCMinutes();

  if (startHour < 8 || endHour > 20 || (endHour === 20 && endMinute > 0)) {
    return {
      isValid: false,
      error: "Bookings must be within business hours (8:00 to 20:00 UTC) (R4).",
    };
  }
  return { isValid: true, error: null };
}
