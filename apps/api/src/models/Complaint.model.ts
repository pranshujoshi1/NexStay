import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaintDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  guestId?: mongoose.Types.ObjectId;
  hostelStudentId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  status: string;
  assignedToStaffId?: mongoose.Types.ObjectId;
  statusHistory: Array<{ status: string; note?: string; changedBy?: string; changedAt: Date }>;
  internalNotes: Array<{ note: string; addedBy: string; addedAt: Date }>;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaintDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    hostelStudentId: { type: Schema.Types.ObjectId, ref: 'HostelStudent', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['ELECTRICITY', 'FOOD', 'INTERNET', 'WATER', 'CLEANING', 'OTHER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedToStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        changedBy: { type: String, default: 'Admin' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    internalNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: String, default: 'Admin' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ComplaintSchema.index({ tenantId: 1, status: 1 });
ComplaintSchema.index({ propertyId: 1, status: 1 });
ComplaintSchema.index({ guestId: 1 });
ComplaintSchema.index({ hostelId: 1, status: 1 });

export const Complaint = mongoose.model<IComplaintDoc>('Complaint', ComplaintSchema);
