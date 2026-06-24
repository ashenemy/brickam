import type { MediaDtoMediaType } from './mediaDtoMediaType';

export interface MediaDto {
  mediaType: MediaDtoMediaType;
  /** URL медиа */
  url: string;
  /** URL превью */
  thumbnailUrl?: string;
  /** Формат файла (jpg/png/mp4...) */
  format?: string;
  /** Размер в байтах */
  sizeBytes?: number;
  /** Длительность видео в секундах */
  durationSec?: number;
  /** Ширина в пикселях */
  width?: number;
  /** Высота в пикселях */
  height?: number;
}
