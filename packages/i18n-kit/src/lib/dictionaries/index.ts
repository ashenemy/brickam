import type { Dictionary, Lang } from '../../@types';
import { en } from './en';
import { hy } from './hy';
import { ru } from './ru';

export const dictionaries: Record<Lang, Dictionary> = { hy, ru, en };
export { en, hy, ru };
