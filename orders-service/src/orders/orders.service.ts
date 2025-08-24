// orders.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from './entities/product.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '../enums/order-status.enum';
import { EncryptService } from 'src/encrypt/encrypt.service';


@Injectable()
export class OrderService {
  private readonly loger = new Logger(OrderService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryptService: EncryptService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory) private orderStatusHistoryRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) { }

  // --- CREATE ORDER ---
  async createOrder(encryptData: any): Promise<any> {
    try {
      const dto: CreateOrderDto = await this.encryptService.Decrypt(encryptData);

      // Lấy list sản phẩm từ bảng products
      const productIds = dto.items.map(i => i.productId);
      let products;
      try {
        products = await this.productRepo.findBy({ id: In(productIds) });
      } catch (error) {
        this.loger.error('Error fetching products:', error);
        throw new NotFoundException('Products not found');
      }
      if (products.length !== dto.items.length) {
        throw new BadRequestException('Invalid product IDs');
      }

      // Kiểm tra tồn kho
      for (const item of dto.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(`Product ${product.name} is out of stock or insufficient quantity`);
        }
      }
      // Tính tổng giá trị đơn hàng
      const totalPrice = dto.items.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        return total + (product.price * item.quantity);
      }, 0);


      // Tạo đơn hàng
      const order = this.orderRepo.create({
        userId: dto.userId,
        receiverName: dto.receiverName,
        receiverPhoneNumber: dto.receiverPhoneNumber,
        receiverAddress: dto.receiverAddress,
        totalPrice,
        status: OrderStatus.PENDING,
      });
      await this.orderRepo.save(order);
      if (!order) {
        throw new BadRequestException('Failed to create order');
      }

      // nếu tạo đơn hàng thành công thì trừ tồn kho
      for (const item of dto.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          product.stock -= item.quantity;
          await this.productRepo.save(product);
        }
      }

      // Tạo các items đơn hàng
      try {
        const orderItems: OrderItem[] = [];
        for (const item of dto.items) {
          const product = products.find(p => p.id === item.productId);
          if (!product) {
            throw new BadRequestException(`Product ${item.productId} not found`);
          }

          orderItems.push(this.orderItemRepo.create({
            order,
            productId: product.id, // hoặc product nếu có quan hệ
            quantity: item.quantity,
            price: product.price,
            productName: product.name,
          }));
        }
        await this.orderItemRepo.save(orderItems);
      } catch (error) {
        this.loger.error('Error creating order items:', error);
        throw new BadRequestException('Failed to create order items');
      }


      // // lỗi ở trên làm dưới này chưa thêm được status history
      await this.addStatusHistory(order, OrderStatus.PENDING, 'Order created');

      return this.encryptService.Encrypt({
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }


  // --- GET ALL ---  
  async getAllOrders(): Promise<any> {
    const orders = await this.orderRepo.find({
      relations: ['items', 'statusHistory'],
    });

    return this.encryptService.Encrypt({
      message: 'Orders fetched successfully',
      data: orders,
    });
  }

  // --- GET BY USER ---
  async getAllOrdersByUserId(encryptData: any): Promise<any> {
    const { userId } = await this.encryptService.Decrypt(encryptData);
    // debug
    this.loger.log(`Fetching orders for user ${userId}...`);
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items', 'statusHistory'],
    });

    return this.encryptService.Encrypt({
      message: 'Orders fetched successfully',
      data: orders,
    });
  }

  // --- GET BY ID ---
  async getOrderById(encryptData: any): Promise<any> {
    const { orderId, userId } = await this.encryptService.Decrypt(encryptData);

    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId: userId },
      relations: ['items', 'statusHistory'],
    });
    if (!order) return this.encryptService.Encrypt({ message: `Order ${orderId} not found` });

    return this.encryptService.Encrypt({
      message: 'Order fetched successfully',
      data: order,
    });
  }

  // --- ADMIN UPDATE ---
  async updateStatusAdmin(encryptData: any): Promise<any> {
    const { orderId, status } = await this.encryptService.Decrypt(encryptData);
    let order;

    order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'statusHistory'],
    });
    if (!order) return this.encryptService.Encrypt({ message: `Order ${orderId} not found` });

    if (![OrderStatus.SHIPPED, OrderStatus.CANCELLED].includes(status)) {
      return this.encryptService.Encrypt({
        message: `Admin chỉ được phép cập nhật shipped hoặc cancelled`,
      });
    }
    if (order.status === OrderStatus.SHIPPED && status === OrderStatus.CANCELLED) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} has been shipped, cannot cancel`,
      });
    }
    if (order.status === OrderStatus.CANCELLED) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} is already cancelled, cannot update to ${status}`,
      });
    }
    if (order.status === status) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} is already in status ${status}, no update needed`,
      });
    }

    order.status = status;
    await this.orderRepo.save(order);
    await this.addStatusHistory(order, status, 'Admin updated status');
    if (status === OrderStatus.CANCELLED) {
      await this.handleCancelOrder(order); // cập nhật tồn kho nếu đơn hàng bị hủy
    }

    return this.encryptService.Encrypt({
      message: 'Order status updated by admin',
      data: order,
    });
  }

  // --- USER UPDATE ---
  async updateStatusUser(encryptData: any): Promise<any> {
    this.loger.log('Updating order status by user...');

    const { orderId, userId, status } = await this.encryptService.Decrypt(encryptData);

    this.loger.log(`Updating order ${orderId} status to ${status} for user ${userId}...`);

    let order;
    order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'statusHistory'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      return this.encryptService.Encrypt({
        message: `User ${userId} is not authorized to update order ${orderId}`,
      });
    }
    if (![OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(status)) {
      return this.encryptService.Encrypt({
        message: `User chỉ được phép cập nhật cancelled hoặc delivered`,
      });
    }
    if (status === OrderStatus.DELIVERED && order.status !== OrderStatus.SHIPPED) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} is not shipped yet, cannot mark as delivered`,
      });
    }
    if (status === OrderStatus.CANCELLED && order.status === OrderStatus.SHIPPED) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} has been shipped, cannot cancel`,
      });
    }
    if (order.status === OrderStatus.CANCELLED) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} is already cancelled, cannot update to ${status}`,
      });
    }
    if (order.status === status) {
      return this.encryptService.Encrypt({
        message: `Order ${orderId} is already in status ${status}, no update needed`,
      });
    }

    order.status = status;
    await this.orderRepo.save(order);
    await this.addStatusHistory(order, status, 'User updated status');
    if (status === OrderStatus.CANCELLED) {
      await this.handleCancelOrder(order); // cập nhật tồn kho nếu đơn hàng bị hủy
    }

    return this.encryptService.Encrypt({
      message: 'Order status updated by user',
      data: order,
    });
  }

  // --- helper ---
  private async addStatusHistory(order: Order, status: OrderStatus, note?: string) {
    const history = this.orderStatusHistoryRepo.create({
      order,
      status,
      note,
    });
    await this.orderStatusHistoryRepo.save(history);
  }

  private async handleCancelOrder(order: Order, reason?: string) {

    // get list order items
    const listItemIDs = order.items;

    // get detail order items
    const orderItems = await this.orderItemRepo.findBy({ id: In(listItemIDs) });

    // update stock for each item
    for (const item of orderItems) {
      const product = await this.productRepo.findOneBy({ id: item.productId });
      if (product) {
        product.stock += item.quantity; // tăng tồn kho
        await this.productRepo.save(product);
      }
    }
  }
}