import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Mengembalikan Prisma Client yang secara otomatis meng-injeksi `tenantId`
   * pada setiap operasi (find, update, delete) untuk mencegah kebocoran data.
   */
  getTenantClient(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Daftar model yang tidak terisolasi per tenant (Tabel Global)
            const globalModels = ['User', 'Tenant', 'Subscription'];
            
            if (globalModels.includes(model)) {
              return query(args);
            }

            // Injeksi otomatis kondisi tenantId untuk model yang terisolasi
            const anyArgs: any = args;
            if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              anyArgs.where = { ...anyArgs.where, tenantId };
            } else if (operation === 'create') {
              anyArgs.data = { ...anyArgs.data, tenantId };
            } else if (operation === 'createMany') {
              if (Array.isArray(anyArgs.data)) {
                anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, tenantId }));
              } else {
                anyArgs.data = { ...anyArgs.data, tenantId };
              }
            } else if (operation === 'upsert') {
              anyArgs.where = { ...anyArgs.where, tenantId };
              anyArgs.create = { ...anyArgs.create, tenantId };
              anyArgs.update = { ...anyArgs.update, tenantId };
            }
            
            return query(anyArgs);
          },
        },
      },
    });
  }
}
