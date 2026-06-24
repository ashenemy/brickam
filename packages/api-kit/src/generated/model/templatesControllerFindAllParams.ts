import type { Object } from './object';

export type TemplatesControllerFindAllParams = {
/**
 * Номер страницы (1-based)
 * @minimum 1
 */
page?: Object;
/**
 * Размер страницы
 * @minimum 1
 */
pageSize?: Object;
};
