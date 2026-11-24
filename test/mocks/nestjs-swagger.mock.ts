const createDecorator = (name: string) => {
  const decorator = (options?: any) => {
    return (target: any, key?: string, descriptor?: any) => {
      if (descriptor) return descriptor;
      return target;
    };
  };
  Object.defineProperty(decorator, 'name', { value: name });
  return decorator;
};

export const ApiTags = createDecorator('ApiTags');
export const ApiOperation = createDecorator('ApiOperation');
export const ApiResponse = createDecorator('ApiResponse');
export const ApiOkResponse = createDecorator('ApiOkResponse');
export const ApiCreatedResponse = createDecorator('ApiCreatedResponse');
export const ApiBadRequestResponse = createDecorator('ApiBadRequestResponse');
export const ApiUnauthorizedResponse = createDecorator(
  'ApiUnauthorizedResponse',
);
export const ApiForbiddenResponse = createDecorator('ApiForbiddenResponse');
export const ApiNotFoundResponse = createDecorator('ApiNotFoundResponse');
export const ApiBody = createDecorator('ApiBody');
export const ApiBearerAuth = createDecorator('ApiBearerAuth');
export const ApiQuery = createDecorator('ApiQuery');
export const ApiParam = createDecorator('ApiParam');
export const ApiHeader = createDecorator('ApiHeader');
export const ApiConsumes = createDecorator('ApiConsumes');
export const ApiProduces = createDecorator('ApiProduces');
export const ApiExcludeEndpoint = createDecorator('ApiExcludeEndpoint');
export const ApiExcludeController = createDecorator('ApiExcludeController');
export const ApiProperty = createDecorator('ApiProperty');
export const ApiPropertyOptional = createDecorator('ApiPropertyOptional');
export const ApiExtraModels = createDecorator('ApiExtraModels');
export const ApiExtension = createDecorator('ApiExtension');

export const getSchemaPath = (model: any) => ({ $ref: model.name });

export const OmitType = (classRef: any) => classRef;
export const PartialType = (classRef: any) => classRef;
export const PickType = (classRef: any, keys: string[]) => classRef;
export const IntersectionType = (...classRefs: any[]) => classRefs[0];

export const SwaggerModule = {
  createDocument: jest.fn(),
  setup: jest.fn(),
};

export class DocumentBuilder {
  setTitle(title: string) {
    return this;
  }
  setDescription(description: string) {
    return this;
  }
  setVersion(version: string) {
    return this;
  }
  addBearerAuth() {
    return this;
  }
  addApiKey() {
    return this;
  }
  addTag(tag: string) {
    return this;
  }
  build() {
    return {};
  }
}

export const swagger = {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
  ApiExcludeEndpoint,
  ApiExcludeController,
  ApiProperty,
  ApiPropertyOptional,
  ApiExtraModels,
  ApiExtension,
  getSchemaPath,
  OmitType,
  PartialType,
  PickType,
  IntersectionType,
  SwaggerModule,
  DocumentBuilder,
};

export default swagger;
