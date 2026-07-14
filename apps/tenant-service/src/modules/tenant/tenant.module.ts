import { Module } from '@nestjs/common';
import { TenantController } from './controllers/tenant.controller';
import { RbacController } from './controllers/rbac.controller';
import { UserController } from './controllers/user.controller';
import { DepartmentController } from './controllers/department.controller';
import { DesignationController } from './controllers/designation.controller';
import { EmployeeController } from './controllers/employee.controller';
import { TenantService } from './services/tenant.service';
import { RbacService } from './services/rbac.service';
import { UserService } from './services/user.service';
import { TenantRepository } from './repositories/tenant.repository';

@Module({
  controllers: [
    TenantController,
    RbacController,
    UserController,
    DepartmentController,
    DesignationController,
    EmployeeController,
  ],
  providers: [TenantService, RbacService, UserService, TenantRepository],
  exports: [TenantService, RbacService, UserService, TenantRepository],
})
export class TenantModule {}
