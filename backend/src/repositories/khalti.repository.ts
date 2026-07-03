import { IKhaltiPayment, KhaltiPaymentModel } from "../models/khalti.model";

export interface IKhaltiRepository {
  createPayment(data: Partial<IKhaltiPayment>): Promise<IKhaltiPayment>;
  getPaymentByPidx(pidx: string): Promise<IKhaltiPayment | null>;
  updatePaymentByPidx(pidx: string,data: Partial<IKhaltiPayment>): Promise<IKhaltiPayment | null>;
  getPaymentById(id: string): Promise<IKhaltiPayment | null>;
  getPaymentsByUser(userId: string): Promise<IKhaltiPayment[]>;
}

export class KhaltiRepository implements IKhaltiRepository {
    async createPayment(data: Partial<IKhaltiPayment>): Promise<IKhaltiPayment> {
        const payment = new KhaltiPaymentModel(data);
        return await payment.save();
    }

    async getPaymentByPidx(pidx: string): Promise<IKhaltiPayment | null> {
        return await KhaltiPaymentModel.findOne({ pidx });
    }

    async updatePaymentByPidx(
        pidx: string,
        data: Partial<IKhaltiPayment>
    ): Promise<IKhaltiPayment | null> {
        const updated = await KhaltiPaymentModel.findOneAndUpdate(
        { pidx },
        data,
        { new: true }
        );
        return updated;
    }

    async getPaymentById(id: string): Promise<IKhaltiPayment | null> {
        return await KhaltiPaymentModel.findById(id);
    }

    async getPaymentsByUser(userId: string): Promise<IKhaltiPayment[]> {
        return await KhaltiPaymentModel.find({ user: userId }).sort({ createdAt: -1 });
    }
}