import { MockSmsService } from './sms.service';

describe('MockSmsService', () => {
  it('sendCode resolves without throwing', async () => {
    const service = new MockSmsService();
    await expect(
      service.sendCode('09120000000', '123456'),
    ).resolves.toBeUndefined();
  });
});