import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import RoleName from '../enums/user_name.enum';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    default: RoleName.USER, // default role
  })
  name: RoleName;

  // Optional: if you want to link users to roles
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
