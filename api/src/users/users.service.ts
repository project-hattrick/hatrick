import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaginatedResponseDto, PaginationQueryDto } from '../common/dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRepository } from './user.repository';

enum PrismaErrorCode {
  UniqueViolation = 'P2002',
  RecordNotFound = 'P2025',
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return UserResponseDto.fromEntity(await this.users.create(dto));
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const [rows, total] = await this.users.findMany(query.skip, query.limit);
    return PaginatedResponseDto.of(
      rows.map((row) => UserResponseDto.fromEntity(row)),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserResponseDto.fromEntity(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      return UserResponseDto.fromEntity(await this.users.update(id, dto));
    } catch (error) {
      throw this.mapPrismaError(error, id);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.users.delete(id);
    } catch (error) {
      throw this.mapPrismaError(error, id);
    }
  }

  private mapPrismaError(error: unknown, id?: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaErrorCode.UniqueViolation.valueOf()) {
        return new ConflictException('walletAddress already registered');
      }
      if (error.code === PrismaErrorCode.RecordNotFound.valueOf()) {
        return new NotFoundException(`User ${id ?? ''} not found`.trim());
      }
    }
    return error as Error;
  }
}
