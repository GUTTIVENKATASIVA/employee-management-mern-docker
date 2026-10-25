import mongoose from 'mongoose';
import { DEPARTMENTS, STATUSES } from '../constants.js';

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254
    },
    phone: { type: String, trim: true, default: '' },
    department: { type: String, required: true, enum: DEPARTMENTS },
    position: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    salary: { type: Number, required: true, min: 0 },
    // Stored as a plain YYYY-MM-DD string to avoid time-zone shifts
    joiningDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, enum: STATUSES, default: 'Active' }
  },
  { timestamps: true, collection: 'employees' }
);

employeeSchema.index({ department: 1 });

export default mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
