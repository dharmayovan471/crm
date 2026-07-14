import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext } from '../../common/context/tenant.context';
import { users } from '../../database/schemas/tenant.schema';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserService } from '../services/user.service';
import { UserCreateDto, UserUpdateDto, UserCreateSchema, UserUpdateSchema } from '../dto/user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('DATABASE_PUBLIC') private readonly publicDb: NodePgDatabase<any>,
  ) {}

  @Post()
  @Roles('ADMIN')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: MESSAGES.USER_CREATE_SUCCESS })
  async create(@Body(new ZodValidationPipe(UserCreateSchema)) dto: UserCreateDto) {
    return this.userService.create(dto);
  }

  @Get()
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: MESSAGES.USER_RETRIEVE_SUCCESS })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.USER_RETRIEVE_SUCCESS })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: MESSAGES.USER_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UserUpdateSchema)) dto: UserUpdateDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: MESSAGES.USER_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Post('profile-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const path = './uploads/profile-photos';
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          cb(null, path);
        },
        filename: (req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload user profile photo' })
  @ApiResponse({ status: 201, description: MESSAGES.PROFILE_PHOTO_UPLOAD_SUCCESS })
  async uploadProfilePhoto(
    @CurrentUser() userPayload: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const db = TenantContext.getDb();
    const fileUrl = `/uploads/profile-photos/${file.filename}`;

    await db
      .update(users)
      .set({ profilePhotoUrl: fileUrl })
      .where(eq(users.id, userPayload.userId));

    return { photoUrl: fileUrl };
  }
}
