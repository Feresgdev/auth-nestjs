import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/models/user.entity';
import { RoleName } from '../enums/user_name.enum';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    default: RoleName.DEFAULT,
  })
  name: RoleName;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
