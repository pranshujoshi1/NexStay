import mongoose, { Document, Schema } from 'mongoose';

export interface IRentRecordDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  hostelStudentId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM or FEE-TYPE
  amount: number;
  paidAmount: number;
  fine: number;
  dueDate: Date;
  status: string;
  paidAt?: Date;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
  isFee?: boolean;
  feeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentRecordSchema = new Schema<IRentRecordDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
    hostelStudentId: { type: Schema.Types.ObjectId, ref: 'HostelStudent', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    fine: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PAID', 'UNPAID', 'PARTIAL'],
      default: 'UNPAID',
    },
    paidAt: { type: Date },
    paymentMethod: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    isFee: { type: Boolean, default: false },
    feeType: { type: String, default: '' },
  },
  { timestamps: true }
);

RentRecordSchema.index({ tenantId: 1, status: 1 });
RentRecordSchema.index({ tenantId: 1, month: 1 });
RentRecordSchema.index({ hostelStudentId: 1, month: 1 });
RentRecordSchema.index({ propertyId: 1, status: 1 });
RentRecordSchema.index({ hostelId: 1, status: 1 });

export const RentRecord = mongoose.model<IRentRecordDoc>('RentRecord', RentRecordSchema);
