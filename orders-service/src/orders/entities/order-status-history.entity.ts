import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  status: string; // pending, confirmed, shipped, delivered, cancelled

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  changedAt: Date;
}
