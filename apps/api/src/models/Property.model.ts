import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  address: string;
  city: string;
  locality?: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  gender: string;
  amenities: string[];
  rules?: string;
  foodIncluded: boolean;
  images: string[];
  videoUrl?: string;
  rentStartingFrom: number;
  verificationStatus: string;
  rejectionReason?: string;
  isActive: boolean;
  isPaused: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IPropertyDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String, default: '' },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    gender: {
      type: String,
      enum: ['BOYS', 'GIRLS', 'CO_ED'],
      default: 'CO_ED',
    },
    amenities: [{ type: String }],
    rules: { type: String, default: '' },
    foodIncluded: { type: Boolean, default: false },
    images: [{ type: String }],
    videoUrl: { type: String, default: '' },
    rentStartingFrom: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PropertySchema.index({ tenantId: 1 });
PropertySchema.index({ city: 1, isActive: 1, verificationStatus: 1 });
PropertySchema.index({ city: 'text', name: 'text', locality: 'text' });

export const Property = mongoose.model<IPropertyDoc>('Property', PropertySchema);
