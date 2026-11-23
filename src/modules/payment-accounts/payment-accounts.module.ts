import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAccountController } from './payment-account.controller';
import { PaymentAccountService } from './payment-account.service';
import { PaymentAccount } from './payment-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentAccount])],
  controllers: [PaymentAccountController],
  providers: [PaymentAccountService],
  exports: [PaymentAccountService],
})
export class PaymentAccountsModule {}
