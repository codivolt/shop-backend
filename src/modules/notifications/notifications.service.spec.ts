import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { User } from '../users/users.entity';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import {
  createTestNotification,
  createTestUser,
} from '../../../test/utils/test-factories';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<Partial<Repository<Notification>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser = createTestUser();
  const mockNotification = createTestNotification({ userId: mockUser.id });

  beforeEach(async () => {
    notificationRepository = createMockRepository<Notification>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification for single user', async () => {
      const createData = {
        userId: mockUser.id,
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
        data: { actionUrl: '/orders/123' },
      };
      notificationRepository.save.mockResolvedValue({
        ...createData,
        id: 'notif-1',
      } as any);

      const result = await service.create(createData);

      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(createData),
      );
      expect(result).toMatchObject(createData);
    });

    it('should create notifications for multiple users', async () => {
      const user2 = createTestUser({
        id: 'user-2',
        email: 'user2@example.com',
      });
      const createData = {
        userIds: [mockUser.id, user2.id],
        type: 'warning' as const,
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
      };
      notificationRepository.save.mockResolvedValue([
        { ...createData, id: 'notif-1', userId: mockUser.id },
        { ...createData, id: 'notif-2', userId: user2.id },
      ] as any);

      const result = await service.create(createData);

      expect(notificationRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const notifications = [
        mockNotification,
        createTestNotification({ userId: mockUser.id, type: 'success' }),
      ];
      notificationRepository.findAndCount.mockResolvedValue([
        notifications,
        notifications.length,
      ]);

      const result = await service.findAll(mockUser.id, { page: 1, limit: 10 });

      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        }),
      );
      expect(result.data).toEqual(notifications);
    });

    it('should filter by isRead', async () => {
      notificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        1,
      ]);

      await service.findAll(mockUser.id, { page: 1, limit: 10, isRead: false });

      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, isRead: false },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const unreadNotification = {
        ...mockNotification,
        isRead: false,
        readAt: null,
      };
      notificationRepository.findOne.mockResolvedValue(unreadNotification);
      notificationRepository.save.mockResolvedValue({
        ...unreadNotification,
        isRead: true,
        readAt: new Date(),
      } as any);

      const result = await service.markAsRead(mockUser.id, mockNotification.id);

      expect(notificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockNotification.id, userId: mockUser.id },
      });
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException if notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead(mockUser.id, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const unreadNotifications = [
        { ...mockNotification, isRead: false, readAt: null },
        {
          ...createTestNotification({ userId: mockUser.id }),
          isRead: false,
          readAt: null,
        },
      ];
      notificationRepository.find.mockResolvedValue(unreadNotifications);
      notificationRepository.save.mockResolvedValue(
        unreadNotifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date(),
        })) as any,
      );

      const result = await service.markAllAsRead(mockUser.id);

      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
      });
      expect(result).toEqual({
        message: 'All notifications marked as read',
        count: 2,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      notificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(mockUser.id);

      expect(notificationRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
      });
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);
      notificationRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockUser.id, mockNotification.id);

      expect(notificationRepository.delete).toHaveBeenCalledWith({
        id: mockNotification.id,
        userId: mockUser.id,
      });
    });

    it('should throw NotFoundException if not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser.id, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
