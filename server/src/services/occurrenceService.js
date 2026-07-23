// Generates concrete class occurrences from a fixed weekly schedule (slots: [{ day, startHour }]).
// Each result carries the originating slot back, so callers can tell which class/instrument
// a given date belongs to when an enrollment mixes several classes with different schedules.
const MAX_DAYS_SCANNED = 400;

function getNextOccurrences(slots, afterDate, count) {
  const results = [];
  const cursor = new Date(afterDate);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  let daysScanned = 0;
  while (results.length < count && daysScanned < MAX_DAYS_SCANNED) {
    const weekday = cursor.getDay();
    const matchingSlots = slots
      .filter((s) => s.day === weekday)
      .sort((a, b) => a.startHour - b.startHour);

    for (const slot of matchingSlots) {
      if (results.length >= count) break;
      const occurrence = new Date(cursor);
      occurrence.setHours(slot.startHour, 0, 0, 0);
      results.push({ date: occurrence, slot });
    }

    cursor.setDate(cursor.getDate() + 1);
    daysScanned += 1;
  }

  return results;
}

module.exports = { getNextOccurrences };
