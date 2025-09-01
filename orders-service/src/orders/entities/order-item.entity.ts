import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'uuid' })
  product: string; // FK từ product-service

  @Column()
  name: string; // snapshot tên sản phẩm

  @Column({ length: 255, nullable: true })
  image: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // snapshot giá tại thời điểm mua

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPrice: number; // price * quantity

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
