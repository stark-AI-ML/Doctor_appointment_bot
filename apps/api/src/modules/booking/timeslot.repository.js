import TimeSlot from "./timeslot.model.js";

class TimeSlotRepository {
  async findByDoctorAndDate(doctorId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return TimeSlot.find({
      doctorId,
      date: { $gte: start, $lte: end },
    }).sort({ startTime: 1 });
  }

  async findAvailable(doctorId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return TimeSlot.find({
      doctorId,
      date: { $gte: start, $lte: end },
      isAvailable: true,
    }).sort({ startTime: 1 });
  }

  async findById(id) {
    return TimeSlot.findById(id);
  }

  async create(data) {
    return TimeSlot.create(data);
  }

  async createMany(slots) {
    return TimeSlot.insertMany(slots);
  }

  async delete(id) {
    return TimeSlot.findByIdAndDelete(id);
  }

  async setAvailability(id, isAvailable) {
    return TimeSlot.findByIdAndUpdate(id, { isAvailable }, { new: true });
  }

  async findByDoctor(doctorId) {
    return TimeSlot.find({ doctorId }).sort({ date: 1, startTime: 1 });
  }

  /** Check if slots already exist for a doctor on a date */

  async existsForDate(doctorId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const count = await TimeSlot.countDocuments({
      doctorId,
      date: { $gte: start, $lte: end },
    });
    return count > 0;
  }
}

export default new TimeSlotRepository();
