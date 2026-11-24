import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../users/users.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Unique(['role', 'permissionId'])
export class RolePermission {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin', enum: UserRole })
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'شناسه مجاز' })
  @Column({ type: 'char', length: 36 })
  permissionId: string;

  @ApiProperty({ description: 'مجاز' })
  @ManyToOne(() => Permission, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;
}
