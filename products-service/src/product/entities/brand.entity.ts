import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './products.entity';

@Entity('brands')
export class Brand {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string = uuidv4();

  @Column({ type: 'varchar', length: 100, unique: true, collation: 'utf8mb4_unicode_ci' })
  name: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
