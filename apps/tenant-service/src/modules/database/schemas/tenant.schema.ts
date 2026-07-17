import { pgTable, uuid, varchar, timestamp, text, boolean, primaryKey, decimal, integer } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  permissions: text('permissions').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const designations = pgTable('designations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  profilePhotoUrl: text('profile_photo_url'),
  designationId: uuid('designation_id').references(() => designations.id, { onDelete: 'set null' }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
]);

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
]);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

// ==========================================
// Marketing & CRM Schemas
// ==========================================

export const salesTeams = pgTable('sales_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamName: varchar('team_name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salesTargets = pgTable('sales_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  teamId: uuid('team_id').references(() => salesTeams.id, { onDelete: 'cascade' }).notNull(),
  targetValue: decimal('target_value', { precision: 12, scale: 2 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salesTeamMembers = pgTable('sales_team_members', {
  teamId: uuid('team_id').references(() => salesTeams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  designation: varchar('designation', { length: 50 }).notNull(), // HEAD, COORDINATOR, MANAGER, MEMBER
}, (t) => [
  primaryKey({ columns: [t.teamId, t.userId] }),
]);

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneCode: varchar('zone_code', { length: 50 }).notNull().unique(),
  zoneName: varchar('zone_name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'cascade' }).notNull(),
  regionCode: varchar('region_code', { length: 50 }).notNull().unique(),
  regionName: varchar('region_name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leadStatuses = pgTable('lead_statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  statusOrder: integer('status_order').notNull(),
  isWon: boolean('is_won').default(false).notNull(),
  isDrop: boolean('is_drop').default(false).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadNo: varchar('lead_no', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }),
  contactPerson: varchar('contact_person', { length: 255 }),
  mobile: varchar('mobile', { length: 20 }),
  alternateMobile: varchar('alternate_mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address1: text('address1'),
  address2: text('address2'),
  city: varchar('city', { length: 100 }),
  district: varchar('district', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  source: varchar('source', { length: 100 }),
  website: varchar('website', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  leadStatusId: uuid('lead_status_id').references(() => leadStatuses.id, { onDelete: 'set null' }),
  leadScore: integer('lead_score').default(0).notNull(),
  remarks: text('remarks'),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  teamId: uuid('team_id').references(() => salesTeams.id, { onDelete: 'set null' }),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'set null' }),
  regionId: uuid('region_id').references(() => regions.id, { onDelete: 'set null' }),
  expectedValue: decimal('expected_value', { precision: 12, scale: 2 }),
  expectedClosingDate: timestamp('expected_closing_date'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: varchar('product_code', { length: 50 }).notNull().unique(),
  productName: varchar('product_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  uom: varchar('uom', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leadProducts = pgTable('lead_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leadNumberSettings = pgTable('lead_number_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  prefix: varchar('prefix', { length: 10 }).default('LD').notNull(),
  currentSequence: integer('current_sequence').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerCode: varchar('customer_code', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  billingAddress: text('billing_address'),
  shippingAddress: text('shipping_address'),
  city: varchar('city', { length: 100 }),
  district: varchar('district', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  gstNo: varchar('gst_no', { length: 20 }),
  panNo: varchar('pan_no', { length: 20 }),
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }),
  remarks: text('remarks'),
  customerType: varchar('customer_type', { length: 50 }),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productPrices = pgTable('product_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  pricingType: varchar('pricing_type', { length: 50 }).default('UNIT').notNull(), // FIXED | UNIT
  minCount: integer('min_count').notNull(),
  maxCount: integer('max_count').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }), // Null if FIXED
  fixedAmount: decimal('fixed_amount', { precision: 12, scale: 2 }), // Null if UNIT
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to').notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationNo: varchar('quotation_no', { length: 50 }).notNull().unique(),
  revisionNo: varchar('revision_no', { length: 50 }).default('R0').notNull(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  quoteDate: timestamp('quote_date').defaultNow().notNull(),
  validUntil: timestamp('valid_until'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('DRAFT').notNull(),
  terms: text('terms'),
  notes: text('notes'),
  preparedBy: uuid('prepared_by').references(() => users.id, { onDelete: 'set null' }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  signature: text('signature'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  rate: decimal('rate', { precision: 12, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  activityDate: timestamp('activity_date').defaultNow().notNull(),
  nextFollowupDate: timestamp('next_followup_date'),
  remarks: text('remarks'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('OPEN').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  contentType: varchar('content_type', { length: 100 }),
  storageLocation: varchar('storage_location', { length: 50 }).default('S3').notNull(),
  localPath: text('local_path'),
  uploadFailed: boolean('upload_failed').default(false).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyCode: varchar('company_code', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const leadSources = pgTable('lead_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const industries = pgTable('industries', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const quotationRevisions = pgTable('quotation_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  revisionNo: varchar('revision_no', { length: 50 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  terms: text('terms'),
  notes: text('notes'),
  itemsSnapshot: text('items_snapshot').notNull(), // JSON snapshot string of line items
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

export const quotationHistory = pgTable('quotation_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }).notNull(),
  revisionNo: varchar('revision_no', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

