import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.NOTIFICATIONS_UPDATE)
  findAll() {
    return this.service.findAll();
  }

  @Get('unread-count')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.NOTIFICATIONS_UPDATE)
  unreadCount() {
    return this.service.unreadCount();
  }

  @Put(':id/read')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.NOTIFICATIONS_UPDATE)
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }
}
