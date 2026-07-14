import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'super_secret_nest_microservice_jwt_access_key_2026'),
    });
  }

  async validate(payload: any) {
    // Check if session exists in Redis/memory
    const sessionKey = `tenant-service:session:${payload.sub}`;
    const sessionExists = await this.redisService.get(sessionKey);
    if (!sessionExists) {
      throw new UnauthorizedException('Session has expired or user is logged out');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      tenantCode: payload.tenantCode,
      schemaName: payload.schemaName,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
