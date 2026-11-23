import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>) {
    const n = this.repo.create(data);
    return this.repo.save(n);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  async markRead(id: string) {
    await this.repo.update(id, { read: true });
    return this.repo.findOne({ where: { id } });
  }

  async unreadCount() {
    return this.repo.count({ where: { read: false } });
  }
}
