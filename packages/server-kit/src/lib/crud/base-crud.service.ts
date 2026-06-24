import { NotFoundException, type Page } from '@brickam/core-kit';
import type { BaseRepository, Filter } from '@brickam/db-kit';
import type { UpdateQuery } from 'mongoose';
import type { PaginationQueryDto } from '../dto/pagination-query.dto';

/**
 * Абстрактный CRUD-сервис над BaseRepository с хуками жизненного цикла.
 * Конкретные сервисы наследуют его и переопределяют beforeCreate/afterChange.
 */
export abstract class BaseCrudService<TEntity, TCreate, TUpdate> {
    protected constructor(
        protected readonly repository: BaseRepository<TEntity>,
        protected readonly maxPageSize = 100,
    ) {}

    protected async beforeCreate(dto: TCreate): Promise<Partial<TEntity>> {
        return dto as unknown as Partial<TEntity>;
    }

    protected async afterChange(_entity: TEntity): Promise<void> {
        // хук для инвалидации кэша/событий — по умолчанию пусто
    }

    async create(dto: TCreate): Promise<TEntity> {
        const data = await this.beforeCreate(dto);
        const entity = (await this.repository.create(data)) as unknown as TEntity;
        await this.afterChange(entity);
        return entity;
    }

    async findAll(query: PaginationQueryDto, filter: Filter<TEntity> = {}): Promise<Page<TEntity>> {
        const pageSize = Math.min(query.pageSize, this.maxPageSize);
        return this.repository.findPaginated(filter, {
            page: query.page,
            pageSize,
        }) as unknown as Promise<Page<TEntity>>;
    }

    async findOne(id: string): Promise<TEntity> {
        const entity = await this.repository.findById(id);
        if (!entity) {
            throw new NotFoundException();
        }
        return entity as unknown as TEntity;
    }

    async update(id: string, dto: TUpdate): Promise<TEntity> {
        const entity = await this.repository.updateById(id, dto as unknown as UpdateQuery<TEntity>);
        if (!entity) {
            throw new NotFoundException();
        }
        const result = entity as unknown as TEntity;
        await this.afterChange(result);
        return result;
    }

    async remove(id: string): Promise<void> {
        const deleted = await this.repository.deleteById(id);
        if (!deleted) {
            throw new NotFoundException();
        }
    }
}
