import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingDoc extends Document {
  guestId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  status: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  advancePaid: number;
  monthlyRent: number;
  aadhaarUrl?: string;
  studentIdUrl?: string;
  photoUrl?: string;
  documentsVerified: boolean;
  paymentId?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDoc>(
  {
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'],
      default: 'PENDING',
    },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    advancePaid: { type: Number, default: 0 },
    monthlyRent: { type: Number, required: true },
    aadhaarUrl: { type: String, default: '' },
    studentIdUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    documentsVerified: { type: Boolean, default: false },
    paymentId: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

BookingSchema.index({ tenantId: 1, status: 1 });
BookingSchema.index({ guestId: 1, status: 1 });
BookingSchema.index({ propertyId: 1, status: 1 });
BookingSchema.index({ hostelId: 1, status: 1 });

export const Booking = mongoose.model<IBookingDoc>('Booking', BookingSchema);
