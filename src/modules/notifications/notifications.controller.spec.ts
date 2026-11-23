import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { createTestNotification, createTestUser } from '../../../test/utils/test-factories';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: jest.Mocked<Partial<NotificationsService>>;

  const mockUser = createTestUser();
  const mockNotification = createTestNotification({ userId: mockUser.id });

  beforeEach(async () => {
    notificationsService = {
      findAll: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const notifications = [mockNotification];
      notificationsService.findAll.mockResolvedValue({ data: notifications, total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false });

      const result = await controller.findAll({ page: 1, limit: 10 }, mockUser);

      expect(notificationsService.findAll).toHaveBeenCalledWith(mockUser.id, { page: 1, limit: 10 });
      expect(result.data).toEqual(notifications);
    });

    it('should filter by isRead', async () => {
      notificationsService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false });

      await controller.findAll({ page: 1, limit: 10, isRead: false }, mockUser);

      expect(notificationsService.findAll).toHaveBeenCalledWith(mockUser.id, { page: 1, limit: 10, isRead: false });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = { ...mockNotification, isRead: true, readAt: new Date() };
      notificationsService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(mockNotification.id, mockUser);

      expect(notificationsService.markAsRead).toHaveBeenCalledWith(mockUser.id, mockNotification.id);
      expect(result).toEqual(readNotification);
    });

    it('should throw NotFoundException if not found', async () => {
      notificationsService.markAsRead.mockRejectedValue(new NotFoundException('اعلان یافت نشد'));

      await expect(controller.markAsRead('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationsService.markAllAsRead.mockResolvedValue({ message: 'All notifications marked as read', count: 5 });

      const result = await controller.markAllAsRead(mockUser);

      expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'All notifications marked as read', count: 5 });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationsService.getUnreadCount.mockResolvedValue({ count: 3 });

      const result = await controller.getUnreadCount(mockUser);

      expect(notificationsService.getUnreadCount).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      notificationsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockNotification.id, mockUser);

      expect(notificationsService.remove).toHaveBeenCalledWith(mockUser.id, mockNotification.id);
      expect(result).toEqual({ message: 'اعلان با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if not found', async () => {
      notificationsService.remove.mockRejectedValue(new NotFoundException('اعلان یافت نشد'));

      await expect(controller.remove('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});