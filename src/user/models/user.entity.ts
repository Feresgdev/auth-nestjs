// src/users/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from '../../shared/models/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', type: 'uuid', nullable: false })
  roleId: string | null;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({
    name: 'activation_token',
    type: 'varchar',
    nullable: true,
    default: null,
  })
  activationToken?: string | null;

  @Column({
    name: 'reset_password_token',
    type: 'varchar',
    nullable: true,
    default: null,
  })
  resetPasswordToken?: string | null;

  @Column({
    name: 'reset_password_expires',
    type: 'timestamp with time zone',
    nullable: true,
    default: null,
  })
  resetPasswordExpires?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
