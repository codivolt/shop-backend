export class ConfigService {
  get = jest.fn((key: string, defaultValue?: any) => defaultValue);
  getOrThrow = jest.fn((key: string) => undefined);
}

export const ConfigModule = {
  forRoot: (options?: any) => ({ module: ConfigModule, providers: [] }),
  forFeature: (options?: any) => ({ module: ConfigModule, providers: [] }),
};

export default { ConfigService, ConfigModule };