import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CacheService } from '../common/cache/cache.service';
import { PaginatedResponseDto, PaginationQueryDto } from '../common/dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRepository } from './repositories';

enum PrismaErrorCode {
  UniqueViolation = 'P2002',
  RecordNotFound = 'P2025',
}

// Display-only reads (never the balance-authorization path — findById stays uncached so bets can't
// authorize against a stale balance). Short TTLs bound any staleness; profile edits bust the name key.
const USERNAME_TTL = 30;
const LIST_TTL = 20;
const usernameKey = (username: string) => `user:byname:${username}`;

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly cache: CacheService,
  ) {}

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
    // Leaderboard/list — TTL-only (no explicit bust): the page self-heals in 20s, cheap vs. a full scan.
    return this.cache.getOrSet(
      `users:list:${query.skip}:${query.limit}`,
      LIST_TTL,
      async () => {
        const [rows, total] = await this.users.findMany(
          query.skip,
          query.limit,
        );
        return PaginatedResponseDto.of(
          rows.map((row) => UserResponseDto.fromEntity(row)),
          total,
          query,
        );
      },
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserResponseDto.fromEntity(user);
  }

  async findByUsername(username: string): Promise<UserResponseDto> {
    // Cache the DTO (not the entity) so Prisma Decimal/Date never round-trip through JSON.
    const cached = await this.cache.get<UserResponseDto>(usernameKey(username));
    if (cached) return cached;
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundException(`User @${username} not found`);
    const dto = UserResponseDto.fromEntity(user);
    await this.cache.set(usernameKey(username), dto, USERNAME_TTL);
    return dto;
  }

  async update(id: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    try {
      const updated = UserResponseDto.fromEntity(
        await this.users.update(id, dto),
      );
      // Bust the public-profile cache so an edit shows immediately (username may have changed).
      if (updated.username) await this.cache.del(usernameKey(updated.username));
      await this.cache.delPrefix('users:list:');
      return updated;
    } catch (error) {
      throw this.mapPrismaError(error, id);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.users.softDelete(id);
    } catch (error) {
      throw this.mapPrismaError(error, id);
    }
  }

  private mapPrismaError(error: unknown, id?: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaErrorCode.UniqueViolation.valueOf()) {
        // meta.target names the offending unique field(s) (e.g. username, email).
        const target = error.meta?.target;
        const field = Array.isArray(target)
          ? target.join(', ')
          : 'walletAddress';
        return new ConflictException(`That ${field} is already taken`);
      }
      if (error.code === PrismaErrorCode.RecordNotFound.valueOf()) {
        return new NotFoundException(`User ${id ?? ''} not found`.trim());
      }
    }
    return error as Error;
  }
}
