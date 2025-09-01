// orders.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from './entities/product.entity';
import { CreateOrderDto } from './dto';
import { EncryptService } from 'src/encrypt/encrypt.service';


@Injectable()
export class OrderService {
  private readonly loger = new Logger(OrderService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryptService: EncryptService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,

  ) { }

  // --- CREATE ORDER ---
  async createOrder(encryptData: any): Promise<any> {
    try {
      const dto: CreateOrderDto = await this.encryptService.Decrypt(encryptData);

      if (!dto || !dto.orderItems || dto.orderItems.length === 0) {
        throw new BadRequestException('Order items are required');
      }

      // debug log dto
      this.loger.log('CreateOrderDto:', dto);
      // Lấy list sản phẩm từ bảng products
      const productIds = dto.orderItems.map(i => i.product);
      let products;
      try {
        products = await this.productRepo.findBy({ id: In(productIds) });
      } catch (error) {
        this.loger.error('Error fetching products:', error);
        throw new NotFoundException('Products not found');
      }

      if (products.length !== dto.orderItems.length) {
        this.loger.error(`Product count mismatch. Expected: ${dto.orderItems.length}, Found: ${products.length}`);
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        this.loger.error('Missing product IDs:', missingIds);
        throw new BadRequestException('Invalid product IDs');
      }

      // debug log products
      this.loger.log('Fetched Products:', products);
      // Kiểm tra tồn kho
      for (const item of dto.orderItems) {
        const product = products.find(p => p.id === item.product);
        this.loger.log(`Found product: ${product ? JSON.stringify({ id: product.id, name: product.name, stock: product.stock }) : 'NOT FOUND'}`);

        if (!product) {
          this.loger.error(`Product with ID ${item.product} not found`);
          throw new BadRequestException(`Product ${item.product} not found`);
        }

        if (product.stock < item.quantity) {
          this.loger.error(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.stock}`);
          throw new BadRequestException(`Product ${product.name} is out of stock or insufficient quantity`);
        }
      }

      // Tính tổng giá trị đơn hàng
      const totalPrice = dto.orderItems.reduce((total, item) => {
        const product = products.find(p => p.id === item.product);
        const itemTotal = product.price * item.quantity;
        this.loger.log(`Item: ${product.name}, Price: ${product.price}, Quantity: ${item.quantity}, Subtotal: ${itemTotal}`);
        return total + itemTotal;
      }, 0);


      if (dto.user == null || dto.user == undefined || dto.user == "") {
        throw new UnauthorizedException('User ID is required');
      }

      // Tạo đơn hàng
      const order = this.orderRepo.create({
        user: dto.user,
        shippingAddress: dto.shippingAddress,
        recipient: dto.recipient,
        phone: dto.phone,
        paymentMethod: dto.paymentMethod,
        orderDate: new Date(),
        totalPrice,
        status: 1,
      });
      await this.orderRepo.save(order);
      if (!order) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'CREATE ORDER FAIL'
        });
      }

      // nếu tạo đơn hàng thành công thì trừ tồn kho
      for (const item of dto.orderItems) {
        const product = products.find(p => p.id === item.product);
        if (product) {
          product.stock -= item.quantity;
          await this.productRepo.save(product);
        }
      }

      // Tạo các items đơn hàng
      try {
        const orderItems: OrderItem[] = [];
        for (const item of dto.orderItems) {
          const product = products.find(p => p.id === item.product);
          if (!product) {
            throw new BadRequestException(`Product ${item.product} not found`);
          }

          const orderItemData = {
            order,
            product: product.id,
            name: product.name,
            quantity: item.quantity,
            price: product.price,
            totalPrice: product.price * item.quantity,
          };

          this.loger.log('Creating order item:', orderItemData);
          orderItems.push(this.orderItemRepo.create(orderItemData));
        }
        await this.orderItemRepo.save(orderItems);
      } catch (error) {
        this.loger.error('Error creating order items:', error);
        throw new BadRequestException('Failed to create order items');
      }


      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        order: order,
        OrderItems: order.items,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  // --- GET ALL ---  
  async getAllOrders(): Promise<any> {
    try {
      const orders = await this.orderRepo.find({
        relations: ['items'],
      });

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'SUCCESS',
        data: orders,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch orders: ${error.message}`);
    }
  }

  // // --- GET BY USER ---
  async getAllOrdersByUserId(encryptData: any): Promise<any> {
    const { userId } = await this.encryptService.Decrypt(encryptData);
    // debug
    this.loger.log(`Fetching orders for user ${userId}...`);
    const orders = await this.orderRepo.find({
      where: { user: userId },
      relations: ['items'],
    });

    return this.encryptService.Encrypt({
      status: 'OK',
      message: 'SUCCESS',
      data: orders,
    });
  }

  // // --- GET BY ID ---
  async getOrder(encryptData: any): Promise<any> {
    const { orderId } = await this.encryptService.Decrypt(encryptData);

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) return this.encryptService.Encrypt({ message: `Order ${orderId} not found` });

    return this.encryptService.Encrypt({
      status: 'OK',
      message: 'SUCCESS',
      data: order,
    });
  }

  // // --- UPDATE ---
  async updateOrder(encryptData: any): Promise<any> {
    const { orderId } = await this.encryptService.Decrypt(encryptData);
    let order;
    order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 1) {
      order.status = 2
    } else if (order.status === 2) {
      order.status = 3
    }
    await this.orderRepo.save(order);

    return this.encryptService.Encrypt({
      status: 'OK',
      message: 'SUCCESS',
    });
  }

  // // --- CANCEL ---
  async cancelOrder(encryptData: any): Promise<any> {
    const { orderId } = await this.encryptService.Decrypt(encryptData);
    let order;
    order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // trả lại tồn kho
    for (const item of order.items) {
      const product = await this.productRepo.findOne({ where: { id: item.product } });
      if (product) {
        product.stock += item.quantity;
        await this.productRepo.save(product);
      }
    }

    order.status = 0;
    await this.orderRepo.save(order);

    return this.encryptService.Encrypt({
      status: 'OK',
      message: 'SUCCESS',
    });
  }

  // // --- DELETE ---
  async deleteOrder(encryptData: any): Promise<any> {
    const { id } = await this.encryptService.Decrypt(encryptData);
    let order;
    order = await this.orderRepo.findOne({
      where: { id: id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // trả lại tồn kho
    if (order.status !== 0) {
      for (const item of order.items) {
        const product = await this.productRepo.findOne({ where: { id: item.product } });
        if (product) {
          product.stock += item.quantity;
          await this.productRepo.save(product);
        }
      }
    }

    // Xóa các mục trong đơn hàng
    await this.orderItemRepo.delete({ order: { id: id } });
    // Xóa đơn hàng
    await this.orderRepo.delete(id);

    return this.encryptService.Encrypt({
      status: 'OK',
      message: 'SUCCESS',
    });
  }
}

