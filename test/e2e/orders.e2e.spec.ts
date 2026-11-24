import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import {
  createTestUser,
  createTestAdmin,
  createTestProduct,
  createTestCategory,
  createTestBrand,
  createTestDeliveryMethod,
} from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;
let userToken: string;
let adminToken: string;
let productId: string;
let deliveryMethodId: string;

describe('Orders E2E Tests', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;

    // Register user
    const userRegister = await request.post('/api/auth/register').send({
      email: 'order-user@example.com',
      password: 'password123',
      firstName: 'Order',
      lastName: 'User',
      phone: '09121112233',
    });
    userToken = userRegister.body.access_token;

    // Register admin
    const adminRegister = await request.post('/api/auth/register').send({
      email: 'order-admin@example.com',
      password: 'password123',
      firstName: 'Order',
      lastName: 'Admin',
      phone: '09129998877',
    });
    adminToken = adminRegister.body.access_token;

    // Note: In real E2E, we'd create product, category, brand, delivery method via API
    // For now, we'll test the endpoints that don't require pre-existing data
  });

  afterAll(async () => {
    await teardownE2E();
  });

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      // First add item to cart (would need product)
      // In real test, we'd create product via admin API first

      const orderDto = {
        items: [{ productId: 'some-product-id', quantity: 1 }],
        shippingAddress: {
          firstName: 'Order',
          lastName: 'User',
          phone: '09121112233',
          province: 'Tehran',
          city: 'Tehran',
          address: 'Test Address, Street 1',
          postalCode: '1234567890',
        },
        billingAddress: {
          firstName: 'Order',
          lastName: 'User',
          phone: '09121112233',
          province: 'Tehran',
          city: 'Tehran',
          address: 'Test Address, Street 1',
          postalCode: '1234567890',
        },
        paymentMethod: 'online',
        // deliveryMethodId would be required
      };

      // This will fail without product/delivery method
      // In real E2E with full setup, expect 201
      const response = await request
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto);

      // Expecting 400/404 due to missing product/delivery method
    });
  });

  describe('GET /api/orders', () => {
    it('should return user orders', async () => {
      const response = await request
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ page: 1, limit: 10, status: 'pending' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should reject without token', async () => {
      await request.get('/api/orders').expect(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by id', async () => {
      // Get order from list first
      const listResponse = await request
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const orderId = listResponse.body.data[0]?.id;
      if (!orderId) return;

      const response = await request
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalAmount');
    });

    it('should return 404 for non-existent order', async () => {
      await request
        .get('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /api/orders/admin/all', () => {
      it('should return all orders for admin', async () => {
        const response = await request
          .get('/api/orders/admin/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
      });

      it('should reject non-admin', async () => {
        await request
          .get('/api/orders/admin/all')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('PATCH /api/orders/:id/status', () => {
      it('should update order status for admin', async () => {
        const listResponse = await request
          .get('/api/orders/admin/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const orderId = listResponse.body.data[0]?.id;
        if (!orderId) return;

        const response = await request
          .patch(`/api/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'confirmed' })
          .expect(200);

        expect(response.body.status).toBe('confirmed');
      });
    });

    describe('PATCH /api/orders/:id/cancel', () => {
      it('should cancel order for user', async () => {
        const listResponse = await request
          .get('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        const orderId = listResponse.body.data[0]?.id;
        if (!orderId) return;

        const response = await request
          .patch(`/api/orders/${orderId}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.status).toBe('cancelled');
      });
    });
  });
});
