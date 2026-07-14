import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private fallbackStore = new Map<string, string>();
  private hasLoggedError = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(this.configService.get<string>('REDIS_PORT', '6379'), 10);
    
    this.client = new Redis({ 
      host, 
      port,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false, // Avoid queuing commands when offline to fail fast and trigger fallback
    });

    this.client.on('error', (err) => {
      if (!this.hasLoggedError) {
        console.warn('⚠️ Redis is offline. Session store will fallback to in-memory Map.');
        this.hasLoggedError = true;
      }
    });

    this.client.on('ready', () => {
      console.log('✅ Redis is online and ready.');
      this.hasLoggedError = false;
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client.status === 'ready') {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      }
    } catch (err) {
      // Fall through to in-memory fallback
    }

    this.fallbackStore.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.fallbackStore.delete(key), ttlSeconds * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client.status === 'ready') {
        return await this.client.get(key);
      }
    } catch (err) {
      // Fall through to in-memory fallback
    }
    return this.fallbackStore.get(key) || null;
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client.status === 'ready') {
        await this.client.del(key);
        return;
      }
    } catch (err) {
      // Fall through to in-memory fallback
    }
    this.fallbackStore.delete(key);
  }
}
