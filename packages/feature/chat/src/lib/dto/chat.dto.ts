import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ChatParticipant, ChatSide, ChatView, MessageType, MessageView } from '../../@types';

/** Тело запроса на создание/получение чата (buyerId — из аутентификации). */
export class CreateChatDto {
    @ApiProperty({ description: 'Идентификатор вендора' })
    @IsString()
    @IsNotEmpty()
    vendorId!: string;
}

/** Тело запроса на отправку сообщения. */
export class SendMessageDto {
    @ApiProperty({
        description: 'Тип сообщения',
        enum: ['text', 'invoice', 'file', 'system'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['text', 'invoice', 'file', 'system'])
    type?: MessageType;

    @ApiProperty({ description: 'Текст сообщения', maxLength: 4000, required: false })
    @IsOptional()
    @IsString()
    @MaxLength(4000)
    text?: string;

    @ApiProperty({ description: 'Ссылка на вложение', required: false })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}

/** Swagger-модель участника чата. */
export class ChatParticipantDto implements ChatParticipant {
    @ApiProperty() userId!: string;
    @ApiProperty({ enum: ['buyer', 'vendor'] }) role!: ChatSide;
}

/** Swagger-модель чата (публичный контракт). */
export class ChatDto implements ChatView {
    @ApiProperty() id!: string;
    @ApiProperty() buyerId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty({ type: [ChatParticipantDto] }) participants!: ChatParticipant[];
    @ApiProperty({ required: false }) lastMessageAt?: Date;
    @ApiProperty() unread!: number;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}

/** Swagger-модель сообщения (публичный контракт). */
export class MessageDto implements MessageView {
    @ApiProperty() id!: string;
    @ApiProperty() chatId!: string;
    @ApiProperty() senderId!: string;
    @ApiProperty({ enum: ['text', 'invoice', 'file', 'system'] }) type!: MessageType;
    @ApiProperty({ required: false }) text?: string;
    @ApiProperty({ required: false }) attachmentUrl?: string;
    @ApiProperty({ required: false }) invoiceId?: string;
    @ApiProperty({ type: [String] }) readBy!: string[];
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
