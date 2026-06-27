import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDoc extends Document {
  propertyId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReviewDoc>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ propertyId: 1 });
ReviewSchema.index({ guestId: 1 });
ReviewSchema.index({ propertyId: 1, guestId: 1 }, { unique: true }); // prevent duplicate reviews

export const Review = mongoose.model<IReviewDoc>('Review', ReviewSchema);
