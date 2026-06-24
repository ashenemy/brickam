import type { Page } from '@brickam/core-kit';
import type { JwtPayload, Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser, PaginationQueryDto } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ChatView, MessageView } from '../@types';
import { ChatService } from './chat.service';
import { ChatDto, CreateChatDto, MessageDto } from './dto/chat.dto';

/** Маршруты чата (Foundations §15, Stage 8). Реалтайм — через ChatGateway. */
@ApiTags('chat')
@Controller('chat')
@Auth()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /** Маппит AuthUser в JwtPayload-подобие для сервиса (sub/role/vendorId). */
    private toPayload(user: AuthUser): JwtPayload {
        const payload: JwtPayload = {
            sub: user.id,
            role: user.role as Role,
            permissions: [],
        };
        if (user.vendorId !== undefined) {
            payload.vendorId = user.vendorId;
        }
        return payload;
    }

    /** Чаты, где текущий пользователь участник (покупатель или вендор). */
    @Get()
    @ApiOkResponse({ type: [ChatDto], description: 'Список чатов пользователя' })
    listChats(@CurrentUser() user: AuthUser): Promise<ChatView[]> {
        return this.chatService.listChats(this.toPayload(user));
    }

    /** Создаёт/возвращает чат текущего покупателя с указанным вендором. */
    @Post()
    @ApiOkResponse({ type: ChatDto, description: 'Чат покупателя с вендором' })
    getOrCreate(@CurrentUser('id') buyerId: string, @Body() dto: CreateChatDto): Promise<ChatView> {
        return this.chatService.getOrCreate(buyerId, dto.vendorId);
    }

    /** Сообщения чата (пагинация). Только участнику. */
    @Get(':id/messages')
    @ApiOkResponse({ type: [MessageDto], description: 'Сообщения чата (страница)' })
    getMessages(
        @CurrentUser() user: AuthUser,
        @Param('id') chatId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<Page<MessageView>> {
        return this.chatService.getMessages(chatId, this.toPayload(user), query);
    }

    /** Помечает чат прочитанным для текущего пользователя. */
    @Post(':id/read')
    @ApiOkResponse({ description: 'Чат помечен прочитанным' })
    markRead(@CurrentUser() user: AuthUser, @Param('id') chatId: string): Promise<void> {
        return this.chatService.markRead(chatId, this.toPayload(user));
    }
}
