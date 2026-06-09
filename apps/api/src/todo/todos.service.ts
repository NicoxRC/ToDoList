import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { Repository } from 'typeorm';
import { TodoDto, UpdateTodoDto } from './todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo) private todoRepository: Repository<Todo>,
  ) {}

  async findAll() {
    return await this.todoRepository.find();
  }

  async findOne(id: number) {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(todo: TodoDto) {
    const newTodo = this.todoRepository.create(todo);
    return await this.todoRepository.save(newTodo);
  }

  async update(id: number, updatedTodo: UpdateTodoDto) {
    const todo = await this.findOne(id);
    this.todoRepository.merge(todo, updatedTodo);
    return await this.todoRepository.save(todo);
  }

  async delete(id: number) {
    const todo = await this.findOne(id);
    return await this.todoRepository.remove(todo);
  }
}
