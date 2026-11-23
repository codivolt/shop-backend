import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@ApiTags('جستجوی پنل')
@ApiBearerAuth('access-token')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      'جستجوی سراسری در محصولات، دسته‌بندی‌ها، برندها، کاربران و سفارشات',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query.q, query.limit);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'پیشنهادات جستجوی اتوماتیک برای فروشگاه' })
  suggestions(@Query() query: SearchQueryDto) {
    return this.searchService.suggestions(query.q, query.limit);
  }
}
