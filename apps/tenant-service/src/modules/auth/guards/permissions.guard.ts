import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('🔍 PermissionsGuard Debug:', {
      requiredPermissions,
      userRoles: user?.roles,
      userPermissions: user?.permissions,
    });
    if (!user || !user.permissions) {
      return false;
    }

    const userPermissions = user.permissions;
    if (userPermissions.includes('*')) {
      return true;
    }

    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}
