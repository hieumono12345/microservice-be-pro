import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'uuid' })
  productId: string; // FK từ product-service

  @Column()
  productName: string; // snapshot tên sản phẩm

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // snapshot giá tại thời điểm mua

  @Column()
  quantity: number;
}
