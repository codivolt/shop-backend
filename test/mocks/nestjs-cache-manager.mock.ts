export const CACHE_MANAGER = 'CACHE_MANAGER';
export const CacheModule = {
  register: (options?: any) => ({ module: CacheModule, providers: [] }),
  registerAsync: (options?: any) => ({ module: CacheModule, providers: [] }),
};

export interface Cache {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
}

export const cacheManager = {
  CACHE_MANAGER,
  CacheModule,
};

export default cacheManager;
