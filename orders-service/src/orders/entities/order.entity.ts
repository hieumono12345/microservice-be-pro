import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from 'src/enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  shippingAddress: string;

  @Column({ type: 'nvarchar', length: 100 })
  recipient: string;

  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ type: 'nvarchar', length: 100 })
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'int', default: 0 })
  status: number;

  @Column({ type: 'uuid' })
  user: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
