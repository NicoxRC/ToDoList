import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { TodoDto, UpdateTodoDto } from './todo.dto';

@ApiTags('todos')
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all todos' })
  @ApiResponse({ status: 200, description: 'List of todos' })
  async findAll() {
    return await this.todosService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a todo by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Todo found' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.todosService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a todo' })
  @ApiResponse({ status: 201, description: 'Todo created' })
  async create(@Body() payload: TodoDto) {
    return await this.todosService.create(payload);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Update a todo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 202, description: 'Todo updated' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateTodoDto,
  ) {
    return await this.todosService.update(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 202, description: 'Todo deleted' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.todosService.delete(id);
  }
}
