import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createTestCategory } from '../../../test/utils/test-factories';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: jest.Mocked<Partial<CategoriesService>>;

  const mockCategory = createTestCategory();
  const mockChildCategory = createTestCategory({ id: 'child-1', parentId: mockCategory.id });
  const mockPaginatedResponse: PaginatedResponse<Category> = {
    data: [mockCategory, mockChildCategory],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    categoriesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getTree: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'New Category',
      slug: 'new-category',
      description: 'New category description',
    };

    it('should create category and return it', async () => {
      const newCategory = createTestCategory({ ...createDto });
      categoriesService.create.mockResolvedValue(newCategory);

      const result = await controller.create(createDto);

      expect(categoriesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newCategory);
    });

    it('should throw ConflictException if slug exists', async () => {
      categoriesService.create.mockRejectedValue(new ConflictException('اسلاگ تکراری است'));

      await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const query: CategoryQueryDto = { page: 1, limit: 10 };

    it('should return paginated categories', async () => {
      categoriesService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(categoriesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should pass all query parameters', async () => {
      const queryWithFilters: CategoryQueryDto = { page: 2, limit: 5, parentId: 'parent-id', isActive: true, search: 'test' };
      categoriesService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(queryWithFilters);

      expect(categoriesService.findAll).toHaveBeenCalledWith(queryWithFilters);
    });
  });

  describe('getTree', () => {
    it('should return category tree', async () => {
      const tree = [createTestCategory({ children: [createTestCategory({ id: 'child-1' })] })];
      categoriesService.getTree.mockResolvedValue(tree);

      const result = await controller.getTree();

      expect(categoriesService.getTree).toHaveBeenCalled();
      expect(result).toEqual(tree);
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      categoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(mockCategory.id);

      expect(categoriesService.findOne).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if not found', async () => {
      categoriesService.findOne.mockRejectedValue(new NotFoundException('دسته‌بندی یافت نشد'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneBySlug', () => {
    it('should return category by slug', async () => {
      categoriesService.findOneBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findOneBySlug(mockCategory.slug);

      expect(categoriesService.findOneBySlug).toHaveBeenCalledWith(mockCategory.slug);
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if not found', async () => {
      categoriesService.findOneBySlug.mockRejectedValue(new NotFoundException('دسته‌بندی یافت نشد'));

      await expect(controller.findOneBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated description',
    };

    it('should update category and return it', async () => {
      const updatedCategory = { ...mockCategory, ...updateDto };
      categoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(mockCategory.id, updateDto);

      expect(categoriesService.update).toHaveBeenCalledWith(mockCategory.id, updateDto);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesService.update.mockRejectedValue(new NotFoundException('دسته‌بندی یافت نشد'));

      await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete category and return success message', async () => {
      categoriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockCategory.id);

      expect(categoriesService.remove).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual({ message: 'دسته‌بندی با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesService.remove.mockRejectedValue(new NotFoundException('دسته‌بندی یافت نشد'));

      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category has children', async () => {
      categoriesService.remove.mockRejectedValue(new BadRequestException('دسته‌بندی دارای زیرمجموعه است'));

      await expect(controller.remove(mockCategory.id)).rejects.toThrow(BadRequestException);
    });
  });
});