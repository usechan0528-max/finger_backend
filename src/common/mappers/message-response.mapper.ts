import { Injectable } from '@nestjs/common';
import { MediaResolverService } from './media-resolver.service';

@Injectable()
export class MessageResponseMapper {
  constructor(private readonly mediaResolverService: MediaResolverService) {}

  async map(message: {
    id: bigint;
    roomId: bigint;
    senderUserId: bigint;
    messageType: string;
    body: string | null;
    attachmentObjectKey: string | null;
    createdAt: Date;
  }) {
    const attachmentUrl =
      message.messageType === 'IMAGE'
        ? await this.mediaResolverService.resolveByVisibility({
            objectKey: message.attachmentObjectKey,
            visibility: 'PRIVATE',
          })
        : null;

    return {
      id: message.id,
      roomId: message.roomId,
      senderUserId: message.senderUserId,
      messageType: message.messageType,
      body: message.body,
      attachmentObjectKey: message.attachmentObjectKey,
      attachmentUrl,
      createdAt: message.createdAt,
    };
  }

  async mapMany(
    messages: Array<{
      id: bigint;
      roomId: bigint;
      senderUserId: bigint;
      messageType: string;
      body: string | null;
      attachmentObjectKey: string | null;
      createdAt: Date;
    }>,
  ) {
    return Promise.all(messages.map((message) => this.map(message)));
  }
}
