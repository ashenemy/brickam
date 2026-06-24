import { type Type, UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from '../interceptors/serialize.interceptor';

/** Сериализует ответ маршрута в экземпляр указанного DTO. */
export const Serialize = (dto: Type) => UseInterceptors(new SerializeInterceptor(dto));
