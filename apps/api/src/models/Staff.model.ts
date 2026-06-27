import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  joiningDate: Date;
  photoUrl?: string;
  isActive: boolean;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaffDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['WARDEN', 'COOK', 'CLEANER', 'SECURITY', 'MANAGER', 'OTHER'],
      required: true,
    },
    salary: { type: Number, required: true, default: 0 },
    joiningDate: { type: Date, required: true },
    photoUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

StaffSchema.index({ tenantId: 1, isActive: 1 });
StaffSchema.index({ propertyId: 1, isActive: 1 });

export const Staff = mongoose.model<IStaffDoc>('Staff', StaffSchema);
