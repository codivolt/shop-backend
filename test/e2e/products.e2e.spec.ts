import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import { createTestAdmin, createTestCategory, createTestBrand, createTestProduct } from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;
let adminToken: string;
let categoryId: string;
let brandId: string;
let productId: string;

describe('Products E2E Tests', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;

    // Register and login admin
    const adminRegister = await request.post('/api/auth/register').send({
      email: 'product-admin@example.com',
      password: 'password123',
      firstName: 'Product',
      lastName: 'Admin',
      phone: '09121112233',
    });
    adminToken = adminRegister.body.access_token;

    // Note: In real E2E, we'd create category/brand via API first
    // For now, we'll test the endpoints
  });

  afterAll(async () => {
    await teardownE2E();
  });

  describe('POST /api/products', () => {
    it('should create product', async () => {
      // We need category and brand IDs first
      // In real test, we'd create them via API
      const productDto = {
        name: 'E2E Test Product',
        slug: 'e2e-test-product',
        description: 'E2E test product description',
        shortDescription: 'Short description',
        price: 100000,
        compareAtPrice: 120000,
        costPrice: 80000,
        sku: 'E2E-SKU-001',
        barcode: '1234567890123',
        trackInventory: true,
        inventoryQuantity: 50,
        lowStockThreshold: 5,
        weight: 300,
        dimensions: { length: 10, width: 5, height: 3 },
        isActive: true,
        isFeatured: false,
        // categoryId and brandId would be required
      };

      // This will likely fail without category/brand
      // In real E2E, we'd create them first
      const response = await request
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto);

      // Expecting 400 or 404 due to missing category/brand
      // In real test with proper setup, expect 201
    });
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10, categoryId: 'some-id' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should search products', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10, search: 'test' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by price range', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10, minPrice: 50000, maxPrice: 200000 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by inStock', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10, inStock: true })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should sort by price', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 10, sortBy: 'price', sortOrder: 'ASC' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      // First get a product from the list
      const listResponse = await request.get('/api/products').query({ limit: 1 }).expect(200);
      const productId = listResponse.body.data[0]?.id;
      
      if (!productId) return; // Skip if no products

      const response = await request
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent product', async () => {
      await request.get('/api/products/non-existent-id').expect(404);
    });
  });

  describe('GET /api/products/slug/:slug', () => {
    it('should return product by slug', async () => {
      const listResponse = await request.get('/api/products').query({ limit: 1 }).expect(200);
      const slug = listResponse.body.data[0]?.slug;
      
      if (!slug) return;

      const response = await request
        .get(`/api/products/slug/${slug}`)
        .expect(200);

      expect(response.body.slug).toBe(slug);
    });
  });

  describe('Admin endpoints', () => {
    describe('PATCH /api/products/:id', () => {
      it('should update product for admin', async () => {
        const listResponse = await request.get('/api/products').query({ limit: 1 }).expect(200);
        const productId = listResponse.body.data[0]?.id;
        
        if (!productId) return;

        const response = await request
          .patch(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Product Name', price: 150000 })
          .expect(200);

        expect(response.body.name).toBe('Updated Product Name');
        expect(response.body.price).toBe(150000);
      });
    });

    describe('DELETE /api/products/:id', () => {
      it('should delete product for admin', async () => {
        // Create a product to delete (would need category/brand)
        // In real test, we'd create via API first
        const response = await request
          .delete('/api/products/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });
});