import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorMember, VendorMemberSchema } from './vendor-member.schema';
import { VendorMembersController } from './vendor-members.controller';
import { VendorMembersRepository } from './vendor-members.repository';
import { VendorMembersService } from './vendor-members.service';

/**
 * Модуль команды вендора (Foundations §14, Stage 15). НЕ @Global.
 * `UsersServiceContract` приходит глобально (модуль users). Зависит только
 * от kit/domain (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: VendorMember.name, schema: VendorMemberSchema }])],
    controllers: [VendorMembersController],
    providers: [VendorMembersRepository, VendorMembersService],
    exports: [VendorMembersService],
})
export class VendorMembersModule {}
