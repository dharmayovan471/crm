import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_nest_microservice_jwt_refresh_key_2026'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader?.replace('Bearer ', '').trim();
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      tenantCode: payload.tenantCode,
      schemaName: payload.schemaName,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      refreshToken,
    };
  }
}
