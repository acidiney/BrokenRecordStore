import { OrderModel } from '../../domain/models/order.model';

export class OrderOutput {
  id?: string;
  recordId?: string;
  recordTitle?: string;
  quantity?: number;
  totalPrice?: number;
  unitPrice?: number;
  created?: Date;

  constructor(props: OrderModel) {
    this.id = props.id;
    this.recordId = props.recordId;
    this.recordTitle = props.recordTitle;
    this.quantity = props.quantity;
    this.totalPrice = props.totalPrice;
    this.unitPrice = props.unitPrice;
    this.created = props.created;
  }

  static fromModel(model: OrderModel): OrderOutput {
    return new OrderOutput(model);
  }
}
