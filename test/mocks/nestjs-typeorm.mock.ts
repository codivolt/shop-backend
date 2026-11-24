export const getRepositoryToken = (entity: any) => `Repository<${entity.name}>`;

export const InjectRepository = (entity: any) => {
  const token = getRepositoryToken(entity);
  return (target: any, key: string, index?: number) => {
    // This mimics what the real InjectRepository does
    if (!target.__injectRepositoryTokens) {
      target.__injectRepositoryTokens = {};
    }
    target.__injectRepositoryTokens[key] = token;
  };
};

export const TypeOrmModule = {
  forRoot: (options: any) => ({ module: TypeOrmModule, providers: [] }),
  forFeature: (entities: any[]) => ({ module: TypeOrmModule, providers: [] }),
};

export class Repository<T = any> {
  find = jest.fn();
  findOne = jest.fn();
  findBy = jest.fn();
  findOneBy = jest.fn();
  findAndCount = jest.fn();
  create = jest.fn();
  save = jest.fn();
  delete = jest.fn();
  update = jest.fn();
  remove = jest.fn();
  count = jest.fn();
  exists = jest.fn();
  createQueryBuilder = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
  }));
}

export class DataSource {
  getRepository = jest.fn((entity: any) => new Repository());
  createEntityManager = jest.fn();
  query = jest.fn();
  transaction = jest.fn();
  manager = {};
}

export const FindOptionsWhere = Object;
export const FindManyOptions = Object;
export const FindOneOptions = Object;
export const SaveOptions = Object;
export const RemoveOptions = Object;
export const UpdateResult = Object;
export const DeleteResult = Object;
export const InsertResult = Object;
export const DeepPartial = Object;
export const EntityTarget = Object;
export const ObjectLiteral = Object;
export const QueryBuilder = Object;
export const SelectQueryBuilder = Object;
export class BaseEntity {}
export const Column = () => (target: any, key: string) => {};
export const PrimaryColumn = () => (target: any, key: string) => {};
export const PrimaryGeneratedColumn = () => (target: any, key: string) => {};
export const CreateDateColumn = () => (target: any, key: string) => {};
export const UpdateDateColumn = () => (target: any, key: string) => {};
export const DeleteDateColumn = () => (target: any, key: string) => {};
export const VersionColumn = () => (target: any, key: string) => {};
export const ManyToOne = (options?: any) => (target: any, key: string) => {};
export const OneToMany = (options?: any) => (target: any, key: string) => {};
export const OneToOne = (options?: any) => (target: any, key: string) => {};
export const ManyToMany = (options?: any) => (target: any, key: string) => {};
export const JoinColumn = (options?: any) => (target: any, key: string) => {};
export const JoinTable = (options?: any) => (target: any, key: string) => {};
export const Relation = (target: any) => (target: any, key: string) => {};
export const Index = (options?: any) => (target: any, key: string) => {};
export const Unique = (options?: any) => (target: any) => target;
export const Check = (expression: string) => (target: any) => target;
export const Exclusion = (expression: string) => (target: any) => target;
export const BeforeInsert = () => (target: any, key: string) => {};
export const BeforeUpdate = () => (target: any, key: string) => {};
export const BeforeRemove = () => (target: any, key: string) => {};
export const AfterInsert = () => (target: any, key: string) => {};
export const AfterUpdate = () => (target: any, key: string) => {};
export const AfterRemove = () => (target: any, key: string) => {};
export const AfterLoad = () => (target: any, key: string) => {};

export const typeorm = {
  getRepositoryToken,
  InjectRepository,
  TypeOrmModule,
  Repository,
  DataSource,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  SaveOptions,
  RemoveOptions,
  UpdateResult,
  DeleteResult,
  InsertResult,
  DeepPartial,
  EntityTarget,
  ObjectLiteral,
  QueryBuilder,
  SelectQueryBuilder,
  BaseEntity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Relation,
  Index,
  Unique,
  Check,
  Exclusion,
  BeforeInsert,
  BeforeUpdate,
  BeforeRemove,
  AfterInsert,
  AfterUpdate,
  AfterRemove,
  AfterLoad,
};

export default typeorm;
