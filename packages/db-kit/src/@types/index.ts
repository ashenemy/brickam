import type { SortOrder } from 'mongoose';

/** Условие сравнения по полю (подмножество операторов Mongo). */
export type FilterCondition<TValue> =
    | TValue
    | {
          $eq?: TValue;
          $ne?: TValue;
          $in?: TValue[];
          $nin?: TValue[];
          $gt?: TValue;
          $gte?: TValue;
          $lt?: TValue;
          $lte?: TValue;
          $exists?: boolean;
          $regex?: string | RegExp;
      };

/** Типобезопасный фильтр по полям сущности (+ произвольные пути/операторы). */
export type Filter<TEntity> = {
    [K in keyof TEntity]?: FilterCondition<TEntity[K]>;
} & Record<string, unknown>;

/** Опции запроса репозитория (сортировка). */
export type RepoQueryOptions = {
    sort?: Record<string, SortOrder>;
};

export type { SortOrder };
