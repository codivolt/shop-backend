import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Permission } from './permission.entity';

@Entity('user_permissions')
export class UserPermission {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'شناسه کاربر' })
  @Column({ type: 'char', length: 36 })
  userId: string;

  @ApiProperty({ description: 'شناسه مجاز' })
  @Column({ type: 'char', length: 36 })
  permissionId: string;

  @ApiProperty({ description: 'کاربر' })
  @ManyToOne(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'مجاز' })
  @ManyToOne(() => Permission, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;
}
