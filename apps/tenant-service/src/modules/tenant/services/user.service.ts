import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { users, designations, departments, employees, userRoles, roles } from '../../database/schemas/tenant.schema';
import { AuthService } from '../../auth/services/auth.service';
import { UserCreateDto, UserUpdateDto, DepartmentCreateDto, DesignationCreateDto, EmployeeCreateDto } from '../dto/user.dto';
import { MESSAGES } from '../../common/constants/messages.constants';

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // ==========================================
  // Users CRUD
  // ==========================================

  async create(dto: UserCreateDto) {
    const db = TenantContext.getDb();
    const hashedPassword = await this.authService.hashPassword(dto.password);

    const result = await db
      .insert(users)
      .values({
        email: dto.email,
        password: hashedPassword,
        designationId: dto.designationId,
        departmentId: dto.departmentId,
        employeeId: dto.employeeId,
        phone: dto.phone,
        isActive: true,
      })
      .returning();

    const newUser = result[0];

    // Assign roles if provided
    if (dto.roleIds && dto.roleIds.length > 0) {
      const rolesToInsert = dto.roleIds.map((roleId) => ({
        userId: newUser.id,
        roleId,
      }));
      await db.insert(userRoles).values(rolesToInsert);
    }

    return this.findOne(newUser.id);
  }

  async findAll() {
    const db = TenantContext.getDb();
    return db
      .select({
        id: users.id,
        email: users.email,
        profilePhotoUrl: users.profilePhotoUrl,
        phone: users.phone,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        designationId: users.designationId,
        designationName: designations.name,
        departmentId: users.departmentId,
        departmentName: departments.name,
        employeeId: users.employeeId,
        employeeCode: employees.employeeCode,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(designations, eq(users.designationId, designations.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(employees, eq(users.employeeId, employees.id));
  }

  async findOne(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        profilePhotoUrl: users.profilePhotoUrl,
        phone: users.phone,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        designationId: users.designationId,
        designationName: designations.name,
        departmentId: users.departmentId,
        departmentName: departments.name,
        employeeId: users.employeeId,
        employeeCode: employees.employeeCode,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(designations, eq(users.designationId, designations.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(employees, eq(users.employeeId, employees.id))
      .where(eq(users.id, id))
      .limit(1);

    const userRecord = result[0];
    if (!userRecord) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Fetch associated roles
    const userRolesResult = await db
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, id));

    return {
      ...userRecord,
      roles: userRolesResult,
    };
  }

  async update(id: string, dto: UserUpdateDto) {
    const db = TenantContext.getDb();

    // Verify user exists
    await this.findOne(id);

    // Update user columns
    await db
      .update(users)
      .set({
        email: dto.email,
        designationId: dto.designationId,
        departmentId: dto.departmentId,
        employeeId: dto.employeeId,
        phone: dto.phone,
        isActive: dto.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Update roles if provided
    if (dto.roleIds) {
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      if (dto.roleIds.length > 0) {
        const rolesToInsert = dto.roleIds.map((roleId) => ({
          userId: id,
          roleId,
        }));
        await db.insert(userRoles).values(rolesToInsert);
      }
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const db = TenantContext.getDb();
    
    // Verify user exists
    await this.findOne(id);

    await db.delete(users).where(eq(users.id, id));
    return { message: 'User deleted successfully' };
  }

  // ==========================================
  // Departments CRUD
  // ==========================================

  async createDepartment(dto: DepartmentCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(departments)
      .values({ name: dto.name })
      .returning();
    return result[0];
  }

  async findAllDepartments() {
    const db = TenantContext.getDb();
    return db.select().from(departments);
  }

  async findDepartmentById(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    
    const dept = result[0];
    if (!dept) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async updateDepartment(id: string, dto: DepartmentCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(departments)
      .set({ name: dto.name })
      .where(eq(departments.id, id))
      .returning();

    const dept = result[0];
    if (!dept) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async deleteDepartment(id: string) {
    const db = TenantContext.getDb();
    
    // Verify department exists
    await this.findDepartmentById(id);

    await db.delete(departments).where(eq(departments.id, id));
    return { message: 'Department deleted successfully' };
  }

  // ==========================================
  // Designations CRUD
  // ==========================================

  async createDesignation(dto: DesignationCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(designations)
      .values({ name: dto.name })
      .returning();
    return result[0];
  }

  async findAllDesignations() {
    const db = TenantContext.getDb();
    return db.select().from(designations);
  }

  async findDesignationById(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .select()
      .from(designations)
      .where(eq(designations.id, id))
      .limit(1);
    
    const desig = result[0];
    if (!desig) {
      throw new NotFoundException(`Designation with ID '${id}' not found`);
    }
    return desig;
  }

  async updateDesignation(id: string, dto: DesignationCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(designations)
      .set({ name: dto.name })
      .where(eq(designations.id, id))
      .returning();

    const desig = result[0];
    if (!desig) {
      throw new NotFoundException(`Designation with ID '${id}' not found`);
    }
    return desig;
  }

  async deleteDesignation(id: string) {
    const db = TenantContext.getDb();
    
    // Verify designation exists
    await this.findDesignationById(id);

    await db.delete(designations).where(eq(designations.id, id));
    return { message: MESSAGES.DESIGNATION_DELETE_SUCCESS };
  }

  // ==========================================
  // Employees CRUD
  // ==========================================

  async createEmployee(dto: EmployeeCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(employees)
      .values({ employeeCode: dto.employeeCode })
      .returning();
    return result[0];
  }

  async findAllEmployees() {
    const db = TenantContext.getDb();
    return db.select().from(employees);
  }

  async findEmployeeById(id: string) {
    const db = TenantContext.getDb();
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);
    
    const emp = result[0];
    if (!emp) {
      throw new NotFoundException(`Employee with ID '${id}' not found`);
    }
    return emp;
  }

  async updateEmployee(id: string, dto: EmployeeCreateDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(employees)
      .set({ employeeCode: dto.employeeCode })
      .where(eq(employees.id, id))
      .returning();

    const emp = result[0];
    if (!emp) {
      throw new NotFoundException(`Employee with ID '${id}' not found`);
    }
    return emp;
  }

  async deleteEmployee(id: string) {
    const db = TenantContext.getDb();
    
    // Verify employee exists
    await this.findEmployeeById(id);

    await db.delete(employees).where(eq(employees.id, id));
    return { message: MESSAGES.EMPLOYEE_DELETE_SUCCESS };
  }
}
