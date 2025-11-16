import { CreateOrderUseCase } from '@/contexts/orders/application/create-order.usecase';
import { ListOrdersUseCase } from '@/contexts/orders/application/list-orders.usecase';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';

describe('OrderController', () => {
  let controller: OrderController;
  let createOrder: { execute: jest.Mock };
  let listOrders: { execute: jest.Mock };

  beforeEach(async () => {
    createOrder = { execute: jest.fn() };
    listOrders = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        { provide: CreateOrderUseCase, useValue: createOrder },
        { provide: ListOrdersUseCase, useValue: listOrders },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('creates a new order', async () => {
    const dto = { recordId: 'rec_1', quantity: 2 } as any;
    const output = {
      id: 'ord_1',
      recordId: 'rec_1',
      recordTitle: 'Artist - Album',
      quantity: 2,
      unitPrice: 10,
      totalPrice: 20,
    };
    createOrder.execute.mockResolvedValue(output);

    const res = await controller.create(dto);
    expect(res).toEqual(output);
    expect(createOrder.execute).toHaveBeenCalledWith({
      recordId: 'rec_1',
      quantity: 2,
    });
  });

  it('returns paginated orders', async () => {
    const payload = {
      page: 1,
      perPage: 20,
      total: 1,
      data: [
        {
          id: 'ord_1',
          recordId: 'rec_1',
          recordTitle: 'Artist - Album',
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
        },
      ],
    } as any;
    listOrders.execute.mockResolvedValue(payload);

    const res = await controller.findAll();
    expect(res).toEqual(payload);
    expect(listOrders.execute).toHaveBeenCalledWith(1, 20);
  });
});
