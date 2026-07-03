import mongoose, { Document, Schema } from "mongoose";

export const KhaltiPaymentStatus = [
  "Initiated",
  "Pending",
  "Completed",
  "Expired",
  "Failed",
  "Canceled",
  "Refunded",
  "Partially Refunded",
] as const;

export type KhaltiPaymentStatusType = (typeof KhaltiPaymentStatus)[number];

const KhaltiPaymentSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    equipment: { type: Schema.Types.ObjectId, ref: "Equipment", required: true },
    pidx: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 1 },
    purchaseOrderId: { type: String, required: true },
    purchaseOrderName: { type: String, required: true },

    status: {
      type: String,
      enum: KhaltiPaymentStatus,
      required: true,
      default: "Initiated",
    },

    transactionId: { type: String, required: false },
    initiateResponse: { type: Schema.Types.Mixed, required: false },
    lookupResponse: { type: Schema.Types.Mixed, required: false },
    isProcessed: { type: Boolean, default: false },
    processedAt: { type: Date, required: false },
    rental: { type: Schema.Types.ObjectId, ref: "Rental", required: false },
  },
  { timestamps: true }
);

KhaltiPaymentSchema.index({ user: 1, equipment: 1, createdAt: -1 });

export interface IKhaltiPayment extends Document {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    equipment: mongoose.Types.ObjectId;
    pidx: string;
    amount: number;
    purchaseOrderId: string;
    purchaseOrderName: string;
    status: KhaltiPaymentStatusType;
    transactionId?: string;
    initiateResponse?: any;
    lookupResponse?: any;
    isProcessed: boolean;
    processedAt?: Date;
    rental?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const KhaltiPaymentModel = mongoose.model<IKhaltiPayment>("KhaltiPayment",KhaltiPaymentSchema);