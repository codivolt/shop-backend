import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity('refresh_tokens')
@Index(['userId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'char', length: 16, nullable: true })
  tokenPrefix: string | null;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  async hashToken() {
    if (this.tokenHash) {
      this.tokenPrefix = this.tokenHash.slice(0, 16);
      this.tokenHash = await bcrypt.hash(this.tokenHash, 10);
    }
  }

  async validateToken(token: string): Promise<boolean> {
    return bcrypt.compare(token, this.tokenHash);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
