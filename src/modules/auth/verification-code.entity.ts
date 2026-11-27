import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  codeHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  setExpiry() {
    const now = new Date();
    this.expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 دقیقه
  }

  async setCode(code: string): Promise<void> {
    this.codeHash = await bcrypt.hash(code, 10);
  }

  async validateCode(code: string): Promise<boolean> {
    return bcrypt.compare(code, this.codeHash);
  }
}
