import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantCode = 
      (req.headers['x-tenant-code'] as string) || 
      (req.body && req.body.tenantCode) || 
      (req.query && req.query.tenantCode as string);
    let schemaName = 'public';

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token) as any;
        if (decoded) {
          tenantCode = tenantCode || decoded.tenantCode;
          schemaName = decoded.schemaName || schemaName;
        }
      } catch (err) {
        // Decode failed; the JwtAuthGuard will handle actual signature verification
      }
    }

    // Default schemaName to tenant_{tenantCode} if tenantCode is provided
    if (tenantCode && tenantCode !== 'public' && schemaName === 'public') {
      schemaName = `tenant_${tenantCode.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    }

    (req as any)['tenantCode'] = tenantCode || 'public';
    (req as any)['schemaName'] = schemaName;

    next();
  }
}
