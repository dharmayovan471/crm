import { Controller, Post, Get, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { QuotationService } from '../services/quotation.service';
import { S3Service } from '../../s3/s3.service';
import { ActivityCreateDto, ActivityCreateSchema } from '../dto/activity.dto';
import { QuotationCreateDto, QuotationCreateSchema } from '../dto/quotation.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';
import { TenantContext } from '../../common/context/tenant.context';
import { attachments } from '../../database/schemas/tenant.schema';

@ApiTags('Activities, Quotations & Attachments')
@Controller()
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly quotationService: QuotationService,
    private readonly s3Service: S3Service,
  ) {}

  // ==========================================
  // Activities APIs
  // ==========================================

  @Post('activities')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Log a customer/lead interaction activity' })
  @ApiResponse({ status: 201, description: MESSAGES.ACTIVITY_CREATE_SUCCESS })
  async logActivity(
    @Body(new ZodValidationPipe(ActivityCreateSchema)) dto: ActivityCreateDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.activityService.create(dto, userId);
  }

  @Get('activities')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all logged activities' })
  @ApiResponse({ status: 200, description: MESSAGES.ACTIVITY_RETRIEVE_SUCCESS })
  async getActivities() {
    return this.activityService.findAll();
  }

  // ==========================================
  // Quotation APIs
  // ==========================================

  @Post('quotations')
  @Permissions('quotation:create')
  @ApiOperation({ summary: 'Create a new quotation' })
  @ApiResponse({ status: 201, description: MESSAGES.QUOTATION_CREATE_SUCCESS })
  async createQuotation(@Body(new ZodValidationPipe(QuotationCreateSchema)) dto: QuotationCreateDto) {
    return this.quotationService.create(dto);
  }

  @Get('quotations')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all quotations' })
  @ApiResponse({ status: 200, description: MESSAGES.QUOTATION_RETRIEVE_SUCCESS })
  async getQuotations() {
    return this.quotationService.findAll();
  }

  @Get('quotations/:id')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get quotation details and items' })
  async getQuotation(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  @Put('quotations/:id')
  @Permissions('quotation:approve')
  @ApiOperation({ summary: 'Update/approve quotation' })
  @ApiResponse({ status: 200, description: MESSAGES.QUOTATION_UPDATE_SUCCESS })
  async updateQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(QuotationCreateSchema)) dto: QuotationCreateDto,
  ) {
    return this.quotationService.update(id, dto);
  }

  // ==========================================
  // Attachments APIs
  // ==========================================

  @Post('attachments/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', example: 'LEAD' },
        entityId: { type: 'string', example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001' },
      },
    },
  })
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Upload file attachment to S3 storage' })
  @ApiResponse({ status: 201, description: MESSAGES.ATTACHMENT_UPLOAD_SUCCESS })
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @CurrentUser('userId') userId: string,
  ) {
    // 1. Upload to S3 (or local fallback)
    const uploadRes = await this.s3Service.uploadFile(file, entityType, entityId);

    // 2. Log metadata in Drizzle schema
    const db = TenantContext.getDb();
    const result = await db
      .insert(attachments)
      .values({
        entityType,
        entityId,
        fileName: uploadRes.fileName,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.fileSize,
        contentType: uploadRes.contentType,
        uploadedBy: userId,
      })
      .returning();

    return result[0];
  }
}
