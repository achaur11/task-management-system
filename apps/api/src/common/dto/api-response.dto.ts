import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  data!: T;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  statusCode!: number;
}

export class TaskResponseWrapperDto {
  @ApiProperty({
    description: 'Task data'
  })
  data!: any;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items'
  })
  data!: T[];

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20
  })
  pageSize!: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100
  })
  total!: number;
}
