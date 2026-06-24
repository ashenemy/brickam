import {
    buildPaginationMeta,
    type Page,
    type PaginationParams,
    pageOffset,
} from '@brickam/core-kit';
import type { HydratedDocument, Model, UpdateQuery } from 'mongoose';
import type { Filter, RepoQueryOptions } from '../@types';

/**
 * Дженерик-репозиторий поверх Mongoose-модели (Foundations §7).
 * Конкретные репозитории наследуют его и передают свою модель в конструктор.
 */
export abstract class BaseRepository<TEntity> {
    protected constructor(protected readonly model: Model<TEntity>) {}

    /** Внутренний доступ к модели с ослабленной типизацией фильтров. */
    private get col(): Model<any> {
        return this.model as unknown as Model<any>;
    }

    create(data: Partial<TEntity>): Promise<HydratedDocument<TEntity>> {
        return this.model.create(data as TEntity) as unknown as Promise<HydratedDocument<TEntity>>;
    }

    findById(id: string): Promise<HydratedDocument<TEntity> | null> {
        return this.model.findById(id).exec();
    }

    findOne(filter: Filter<TEntity>): Promise<HydratedDocument<TEntity> | null> {
        return this.col.findOne(filter).exec();
    }

    find(
        filter: Filter<TEntity> = {},
        options: RepoQueryOptions = {},
    ): Promise<HydratedDocument<TEntity>[]> {
        const query = this.col.find(filter);
        if (options.sort) {
            query.sort(options.sort);
        }
        return query.exec();
    }

    async findPaginated(
        filter: Filter<TEntity>,
        params: PaginationParams,
        options: RepoQueryOptions = {},
    ): Promise<Page<HydratedDocument<TEntity>>> {
        const sort = options.sort ?? { createdAt: -1 };
        const [data, total] = await Promise.all([
            this.col
                .find(filter)
                .sort(sort)
                .skip(pageOffset(params.page, params.pageSize))
                .limit(params.pageSize)
                .exec(),
            this.col.countDocuments(filter).exec(),
        ]);
        return {
            data: data as HydratedDocument<TEntity>[],
            meta: buildPaginationMeta(total, params.page, params.pageSize),
        };
    }

    updateById(
        id: string,
        update: UpdateQuery<TEntity>,
    ): Promise<HydratedDocument<TEntity> | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).exec();
        return result !== null;
    }

    count(filter: Filter<TEntity> = {}): Promise<number> {
        return this.col.countDocuments(filter).exec();
    }

    async exists(filter: Filter<TEntity>): Promise<boolean> {
        const result = await this.col.exists(filter);
        return result !== null;
    }
}
