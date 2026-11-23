import { Injectable } from '@nestjs/common';

export abstract class SmsService {
  abstract sendCode(phone: string, code: string): Promise<void>;
}

@Injectable()
export class MockSmsService extends SmsService {
  async sendCode(phone: string, code: string): Promise<void> {
    console.log(`\n╔═══════════════════════════════════════════╗`);
    console.log(`║  SMS کد تایید برای ${phone}`);
    console.log(`║  کد: ${code}`);
    console.log(`╚═══════════════════════════════════════════╝\n`);
  }
}
