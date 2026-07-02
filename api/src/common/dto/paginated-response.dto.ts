import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

import type { PaginationQueryDto } from './pagination-query.dto';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page (1-based)', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total items across all pages', example: 42 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages!: number;
}

/** Generic list envelope: `{ data, meta }`. Reuse for every paginated endpoint. */
export class PaginatedResponseDto<T> {
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;

  static of<T>(
    data: T[],
    total: number,
    query: PaginationQueryDto,
  ): PaginatedResponseDto<T> {
    const dto = new PaginatedResponseDto<T>();
    dto.data = data;
    dto.meta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
    return dto;
  }
}

/**
 * Swagger cannot express generics — this decorator documents
 * `PaginatedResponseDto<Model>` as a concrete `allOf` schema.
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description: `Paginated list of ${model.name}`,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(model) } },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
