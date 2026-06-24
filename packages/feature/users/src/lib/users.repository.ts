import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, type UserDocument } from './user.schema';

/** Репозиторий пользователей поверх Mongoose-модели User (Foundations §7). */
@Injectable()
export class UsersRepository extends BaseRepository<User> {
    constructor(@InjectModel(User.name) model: Model<User>) {
        super(model);
    }

    /** Находит пользователя по номеру телефона (уникальный индекс). */
    findByPhone(phone: string): Promise<UserDocument | null> {
        return this.findOne({ phone });
    }
}
