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
  OneToMany,
} from 'typeorm';
import { Role } from '../../shared/models/role.entity';
import { ResetPasswordToken } from './reset_password_token.entity';
import { ActivationToken } from './activation_token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role_id', type: 'uuid', nullable: false })
  roleId: string | null;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'profile_picture_url', type: 'varchar', nullable: true })
  profilePictureUrl: string | null;

  @Column()
  password: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => ResetPasswordToken, (rp) => rp.user)
  resetPasswords?: ResetPasswordToken[];

  @OneToMany(() => ActivationToken, (rp) => rp.user)
  activationTokens?: ActivationToken[];
}
