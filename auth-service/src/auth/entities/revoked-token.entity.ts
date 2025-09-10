import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64 }) // SHA256 hash là 64 characters
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}
