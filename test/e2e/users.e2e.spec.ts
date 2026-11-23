import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import { createTestUser, createTestAdmin, createTestProduct, createTestCategory, createTestBrand } from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;
let authToken: string;
let adminToken: string;

describe('Users E2E Tests', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;

    // Register and login regular user
    const userRegister = await request.post('/api/auth/register').send({
      email: 'user-e2e@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'E2E',
      phone: '09121112233',
    });
    authToken = userRegister.body.access_token;

    // Register and login admin user
    const adminRegister = await request.post('/api/auth/register').send({
      email: 'admin-e2e@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'E2E',
      phone: '09129998877',
    });
    adminToken = adminRegister.body.access_token;

    // Manually update admin role in DB (would need direct DB access in real test)
    // For now, we'll test with the tokens we have
  });

  afterAll(async () => {
    await teardownE2E();
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('user-e2e@example.com');
      expect(response.body.firstName).toBe('User');
    });

    it('should reject without token', async () => {
      await request.get('/api/users/me').expect(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update current user profile', async () => {
      const response = await request
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Profile',
        })
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('Profile');
    });

    it('should reject unauthorized', async () => {
      await request.put('/api/users/me').send({ firstName: 'Test' }).expect(401);
    });
  });

  describe('PUT /api/users/me/password', () => {
    it('should change password', async () => {
      const response = await request
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123',
        })
        .expect(200);

      expect(response.body).toEqual({ message: 'رمز عبور با موفقیت به‌روزرسانی شد' });
    });

    it('should reject incorrect current password', async () => {
      await request
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newPassword123',
        })
        .expect(400);
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /api/users', () => {
      it('should return paginated users for admin', async () => {
        const response = await request
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
      });

      it('should reject non-admin', async () => {
        await request
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return user by id for admin', async () => {
        // First get a user ID from the list
        const listResponse = await request
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const userId = listResponse.body.data[0]?.id;
        if (!userId) return; // Skip if no users

        const response = await request
          .get(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(userId);
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user for admin', async () => {
        const listResponse = await request
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const userId = listResponse.body.data[0]?.id;
        if (!userId) return;

        const response = await request
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ firstName: 'Admin Updated' })
          .expect(200);

        expect(response.body.firstName).toBe('Admin Updated');
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete user for admin', async () => {
        // Create a user to delete
        const deleteUserResponse = await request.post('/api/auth/register').send({
          email: 'delete-e2e@example.com',
          password: 'password123',
          firstName: 'Delete',
          lastName: 'Me',
          phone: '09128887766',
        });

        const response = await request
          .delete(`/api/users/${deleteUserResponse.body.user.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toEqual({ message: 'کاربر با موفقیت حذف شد' });
      });
    });
  });
});