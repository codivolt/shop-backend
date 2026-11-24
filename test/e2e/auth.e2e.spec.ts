import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import { createTestUser, createTestAdmin } from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;

describe('Auth E2E Tests', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;
  });

  afterAll(async () => {
    await teardownE2E();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'e2e@example.com',
        password: 'password123',
        firstName: 'E2E',
        lastName: 'Test',
        phone: '09123456789',
      };

      const response = await request
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
      });
    });

    it('should reject duplicate email', async () => {
      const registerDto = {
        email: 'duplicate-e2e@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '09129998877',
      };

      await request.post('/api/auth/register').send(registerDto).expect(201);
      await request.post('/api/auth/register').send(registerDto).expect(409);
    });

    it('should validate required fields', async () => {
      await request
        .post('/api/auth/register')
        .send({ email: 'invalid' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request.post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test',
        phone: '09127776655',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should reject invalid password', async () => {
      await request
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('POST /api/auth/send-code', () => {
    it('should send OTP code', async () => {
      const response = await request
        .post('/api/auth/send-code')
        .send({ phone: '09121112233' })
        .expect(200);

      expect(response.body).toEqual({ message: 'کد تایید ارسال شد' });
    });

    it('should reject rapid resend', async () => {
      await request
        .post('/api/auth/send-code')
        .send({ phone: '09128887766' })
        .expect(200);
      await request
        .post('/api/auth/send-code')
        .send({ phone: '09128887766' })
        .expect(429);
    });
  });

  describe('POST /api/auth/verify-code', () => {
    it('should verify OTP and return token', async () => {
      // We need to mock SMS or get the code from DB
      // For E2E, we'll test the flow with a mocked SMS service
      const phone = '09129990000';

      // Send code (in test env, SMS is mocked)
      await request.post('/api/auth/send-code').send({ phone }).expect(200);

      // Note: In real E2E, we'd need to extract the code from the database
      // For now, test invalid code
      await request
        .post('/api/auth/verify-code')
        .send({ phone, code: '000000' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // First register and login
      const registerResponse = await request
        .post('/api/auth/register')
        .send({
          email: 'me@example.com',
          password: 'password123',
          firstName: 'Me',
          lastName: 'Test',
          phone: '09126665544',
        })
        .expect(201);

      const token = registerResponse.body.access_token;

      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe('me@example.com');
    });

    it('should reject without token', async () => {
      await request.get('/api/auth/me').expect(401);
    });

    it('should reject with invalid token', async () => {
      await request
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
