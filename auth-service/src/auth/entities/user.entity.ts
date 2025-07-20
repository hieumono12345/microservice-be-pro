/* eslint-disable */
// src/auth/entities/user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: 'local' })
  provider: string;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  emailVerificationTokenExpiresAt?: Date | null;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  loginLockedUntil: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken?: string | null;

  @Column({ type: 'datetime', nullable: true })
  resetPasswordTokenExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
