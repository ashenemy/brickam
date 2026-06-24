
export type MediaDtoMediaType = typeof MediaDtoMediaType[keyof typeof MediaDtoMediaType];


export const MediaDtoMediaType = {
  image: 'image',
  video: 'video',
} as const;
