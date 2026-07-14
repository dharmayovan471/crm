import { Module } from '@nestjs/common';
import { LeadController } from './controllers/lead.controller';
import { CustomerController } from './controllers/customer.controller';
import { TeamController } from './controllers/team.controller';
import { ProductController } from './controllers/product.controller';
import { ActivityController } from './controllers/activity.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ZoneController } from './controllers/zone.controller';

import { LeadService } from './services/lead.service';
import { CustomerService } from './services/customer.service';
import { TeamService } from './services/team.service';
import { ProductService } from './services/product.service';
import { ActivityService } from './services/activity.service';
import { QuotationService } from './services/quotation.service';
import { DashboardService } from './services/dashboard.service';

import { LeadRepository } from './repositories/lead.repository';
import { CustomerRepository } from './repositories/customer.repository';
import { TeamRepository } from './repositories/team.repository';
import { ProductRepository } from './repositories/product.repository';

import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [
    LeadController,
    CustomerController,
    TeamController,
    ProductController,
    ActivityController,
    DashboardController,
    ZoneController,
  ],
  providers: [
    LeadService,
    CustomerService,
    TeamService,
    ProductService,
    ActivityService,
    QuotationService,
    DashboardService,
    
    LeadRepository,
    CustomerRepository,
    TeamRepository,
    ProductRepository,
  ],
  exports: [
    LeadService,
    CustomerService,
    TeamService,
    ProductService,
    ActivityService,
    QuotationService,
    DashboardService,
  ],
})
export class MarketingModule {}
