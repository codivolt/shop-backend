import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { ReferralTier } from './referral-tier.entity';
import { RefreshToken } from '../auth/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ReferralTier, RefreshToken])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
