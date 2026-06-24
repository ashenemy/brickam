import { UsersServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/**
 * Глобальный модуль пользователей. Биндит реализацию `UsersService` к
 * DI-токену `UsersServiceContract`, чтобы фичи (например auth) зависели только
 * от контракта (Foundations §1).
 */
@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [UsersController],
    providers: [
        UsersRepository,
        UsersService,
        { provide: UsersServiceContract, useExisting: UsersService },
    ],
    exports: [UsersService, UsersServiceContract, MongooseModule],
})
export class UsersModule {}
