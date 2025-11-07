import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeArticleDto } from './dto/create-knowledge-article.dto';
import { UpdateKnowledgeArticleDto } from './dto/update-knowledge-article.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all knowledge articles' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'published', required: false })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: PaginationDto & { category?: string; tags?: string; published?: string }) {
    return this.knowledgeService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single knowledge article' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create knowledge article' })
  @ApiResponse({ status: 201 })
  create(@Body() createKnowledgeArticleDto: CreateKnowledgeArticleDto) {
    return this.knowledgeService.create(createKnowledgeArticleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update knowledge article' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() updateKnowledgeArticleDto: UpdateKnowledgeArticleDto) {
    return this.knowledgeService.update(id, updateKnowledgeArticleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete knowledge article' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish article' })
  @ApiResponse({ status: 200 })
  publish(@Param('id') id: string) {
    return this.knowledgeService.publish(id);
  }

  @Public()
  @Get('category/:category')
  @ApiOperation({ summary: 'Get articles by category' })
  @ApiResponse({ status: 200 })
  findByCategory(@Param('category') category: string, @Query() query: PaginationDto) {
    return this.knowledgeService.findByCategory(category, query);
  }

  @Public()
  @Get('search/:query')
  @ApiOperation({ summary: 'Search articles' })
  @ApiResponse({ status: 200 })
  search(@Param('query') query: string, @Query() paginationQuery: PaginationDto) {
    return this.knowledgeService.search(query, paginationQuery);
  }
}

