import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

let app: INestApplication;
let dataSource: DataSource;
let moduleRef: TestingModule;

export const setupE2E = async (): Promise<{
  app: INestApplication;
  request: request.SuperTest<request.Test>;
  moduleRef: TestingModule;
  dataSource: DataSource;
}> => {
  moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();

  dataSource = moduleRef.get<DataSource>(DataSource);

  return {
    app,
    request: request(app.getHttpServer()),
    moduleRef,
    dataSource,
  };
};

export const teardownE2E = async (): Promise<void> => {
  if (dataSource) {
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
};

export const getTestApp = (): INestApplication => app;
export const getTestRequest = (): request.SuperTest<request.Test> => request(app.getHttpServer());
export const getTestModule = (): TestingModule => moduleRef;
export const getTestDataSource = (): DataSource => dataSource;