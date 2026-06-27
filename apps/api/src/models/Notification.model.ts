import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDoc extends Document {
  userId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL'],
      default: 'IN_APP',
    },
    isRead: { type: Boolean, default: false },
    linkUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDoc>('Notification', NotificationSchema);
