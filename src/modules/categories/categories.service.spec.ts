import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestCategory } from '../../../test/utils/test-factories';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<Partial<Repository<Category>>>;

  const mockCategory = createTestCategory();
  const mockChildCategory = createTestCategory({ id: 'child-1', parentId: mockCategory.id, name: 'Child Category' });

  beforeEach(async () => {
    categoryRepository = createMockRepository<Category>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'New Category',
      slug: 'new-category',
      description: 'New category description',
      parentId: null,
      sortOrder: 0,
      isActive: true,
    };

    it('should create a new category successfully', async () => {
      const newCategory = createTestCategory({ ...createDto });
      categoryRepository.save.mockResolvedValue(newCategory as any);

      const result = await service.create(createDto);

      expect(categoryRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(createDto);
    });

    it('should throw ConflictException if slug already exists', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create({ ...createDto, slug: mockCategory.slug })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parentId does not exist', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create({ ...createDto, parentId: 'nonexistent' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const query: CategoryQueryDto = { page: 1, limit: 10 };

    it('should return paginated categories', async () => {
      const categories = [mockCategory, mockChildCategory];
      categoryRepository.findAndCount.mockResolvedValue([categories, categories.length]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(categories);
      expect(result.total).toBe(categories.length);
    });

    it('should filter by parentId', async () => {
      categoryRepository.findAndCount.mockResolvedValue([[mockChildCategory], 1]);

      const result = await service.findAll({ ...query, parentId: mockCategory.id });

      expect(categoryRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ parentId: mockCategory.id }),
      }));
    });

    it('should filter by isActive', async () => {
      categoryRepository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await service.findAll({ ...query, isActive: true });

      expect(categoryRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }));
    });

    it('should search by name', async () => {
      categoryRepository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await service.findAll({ ...query, search: 'Category' });

      expect(categoryRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ name: expect.anything() }),
          expect.objectContaining({ slug: expect.anything() }),
        ]),
      }));
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(result).toEqual(mockCategory);
    });

    it('should return category by slug', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOneBySlug(mockCategory.slug);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { slug: mockCategory.slug } });
    });

    it('should throw NotFoundException if not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated description',
    };

    it('should update category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...updateDto };
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.save.mockResolvedValue(updatedCategory as any);

      const result = await service.update(mockCategory.id, updateDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { id: mockCategory.id } });
      expect(categoryRepository.merge).toHaveBeenCalled();
      expect(result.name).toBe('Updated Category');
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const existingCategory = createTestCategory({ slug: 'existing-slug' });
      categoryRepository.findOne.mockResolvedValueOnce(mockCategory);
      categoryRepository.findOne.mockResolvedValueOnce(existingCategory);

      await expect(service.update(mockCategory.id, { slug: 'existing-slug' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove category successfully', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockCategory.id);

      expect(categoryRepository.delete).toHaveBeenCalledWith(mockCategory.id);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category has children', async () => {
      const categoryWithChildren = { ...mockCategory, children: [mockChildCategory] };
      categoryRepository.findOne.mockResolvedValue(categoryWithChildren);

      await expect(service.remove(mockCategory.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category has products', async () => {
      const categoryWithProducts = { ...mockCategory, products: [{ id: 'prod-1' }] };
      categoryRepository.findOne.mockResolvedValue(categoryWithProducts);

      await expect(service.remove(mockCategory.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTree', () => {
    it('should return category tree', async () => {
      const rootCategory = createTestCategory({ parentId: null });
      const childCategory = createTestCategory({ parentId: rootCategory.id });
      categoryRepository.find.mockResolvedValue([rootCategory, childCategory]);

      const result = await service.getTree();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });
  });
});