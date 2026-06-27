import mongoose, { Document, Schema } from 'mongoose';

export interface IMessMenuDoc extends Document {
  hostelId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  uploadedBy: mongoose.Types.ObjectId;
  breakfast: {
    items: string[];
    photoUrl: string | null;
  };
  lunch: {
    items: string[];
    photoUrl: string | null;
  };
  dinner: {
    items: string[];
    photoUrl: string | null;
  };
  specialNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema(
  {
    items:    { type: [String], default: [] },
    photoUrl: { type: String, default: null },
  },
  { _id: false }
);

const MessMenuSchema = new Schema<IMessMenuDoc>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    breakfast: { type: MealSchema, default: () => ({ items: [], photoUrl: null }) },
    lunch:     { type: MealSchema, default: () => ({ items: [], photoUrl: null }) },
    dinner:    { type: MealSchema, default: () => ({ items: [], photoUrl: null }) },
    specialNote: { type: String, default: '' },
  },
  { timestamps: true }
);

MessMenuSchema.index({ hostelId: 1, date: 1 }, { unique: true });
MessMenuSchema.index({ tenantId: 1 });

export const MessMenu = mongoose.model<IMessMenuDoc>('MessMenu', MessMenuSchema);
