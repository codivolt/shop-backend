import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import { createTestAdmin } from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;
let adminToken: string;
let categoryId: string;

describe('Categories E2E Tests', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;

    const adminRegister = await request.post('/api/auth/register').send({
      email: 'category-admin@example.com',
      password: 'password123',
      firstName: 'Category',
      lastName: 'Admin',
      phone: '09121112233',
    });
    adminToken = adminRegister.body.access_token;
  });

  afterAll(async () => {
    await teardownE2E();
  });

  describe('POST /api/categories', () => {
    it('should create category', async () => {
      const response = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Category',
          slug: 'e2e-test-category',
          description: 'E2E test category description',
          isActive: true,
          sortOrder: 0,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('E2E Test Category');
      expect(response.body.slug).toBe('e2e-test-category');
      categoryId = response.body.id;
    });

    it('should reject duplicate slug', async () => {
      await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Category',
          slug: 'e2e-test-category', // duplicate
          description: 'Description',
        })
        .expect(409);
    });

    it('should validate required fields', async () => {
      await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(400);
    });
  });

  describe('GET /api/categories', () => {
    it('should return paginated categories', async () => {
      const response = await request
        .get('/api/categories')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by parentId', async () => {
      const response = await request
        .get('/api/categories')
        .query({ page: 1, limit: 10, parentId: 'some-id' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should search categories', async () => {
      const response = await request
        .get('/api/categories')
        .query({ page: 1, limit: 10, search: 'test' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/categories/tree', () => {
    it('should return category tree', async () => {
      const response = await request.get('/api/categories/tree').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return category by id', async () => {
      if (!categoryId) return;

      const response = await request
        .get(`/api/categories/${categoryId}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('E2E Test Category');
    });

    it('should return 404 for non-existent category', async () => {
      await request.get('/api/categories/non-existent-id').expect(404);
    });
  });

  describe('GET /api/categories/slug/:slug', () => {
    it('should return category by slug', async () => {
      if (!categoryId) return;

      const category = await request
        .get(`/api/categories/${categoryId}`)
        .expect(200);
      const slug = category.body.slug;

      const response = await request
        .get(`/api/categories/slug/${slug}`)
        .expect(200);

      expect(response.body.slug).toBe(slug);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('should update category', async () => {
      if (!categoryId) return;

      const response = await request
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Category Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should reject duplicate slug on update', async () => {
      if (!categoryId) return;

      // Create another category first
      const createResponse = await request
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Category',
          slug: 'another-category',
          description: 'Description',
        })
        .expect(201);

      // Try to update first category with second's slug
      await request
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'another-category' })
        .expect(409);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category', async () => {
      if (!categoryId) return;

      const response = await request
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: 'دسته‌بندی با موفقیت حذف شد' });
    });

    it('should return 404 for non-existent category', async () => {
      await request
        .delete('/api/categories/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
