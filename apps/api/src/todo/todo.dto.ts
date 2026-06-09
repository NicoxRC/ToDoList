import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TodoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Buy groceries',
    description: 'The title of the todo item',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Get milk and bread from the store',
    description: 'The description of the todo item',
  })
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    example: false,
    description: 'The completion status of the todo item',
  })
  completed: boolean;
}

export class UpdateTodoDto extends PartialType(TodoDto) {}
