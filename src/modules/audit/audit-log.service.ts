import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  search?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(entry: {
    userId?: string | null;
    userName?: string | null;
    userPhone?: string | null;
    userRole?: string | null;
    method: string;
    path: string;
    statusCode?: number | null;
    ip?: string | null;
  }): Promise<void> {
    try {
      const log = this.repo.create({
        userId: entry.userId ?? null,
        userName: entry.userName ?? null,
        userPhone: entry.userPhone ?? null,
        userRole: entry.userRole ?? null,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode ?? null,
        ip: entry.ip ?? null,
      });
      await this.repo.save(log);
    } catch {
      // never block the request on audit failures
    }
  }

  async findAll(query: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
    const pagination = resolvePagination(query);
    const qb = this.repo.createQueryBuilder('log');

    if (query.userId) {
      qb.andWhere('log.userId = :userId', { userId: query.userId });
    }
    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        '(log.userName LIKE :s OR log.userPhone LIKE :s OR log.path LIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return buildPaginatedResponse(data, total, pagination);
  }
}