import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class MediaPolicy {
  resolveVisibility(params: {
    purpose: 'POST' | 'STORY' | 'MESSAGE' | 'PROFILE';
    requestedVisibility?: 'PUBLIC' | 'PRIVATE';
  }): 'PUBLIC' | 'PRIVATE' {
    const { purpose, requestedVisibility } = params;

    if (purpose === 'MESSAGE') {
      return 'PRIVATE';
    }

    if (purpose === 'PROFILE') {
      return requestedVisibility ?? 'PUBLIC';
    }

    if (purpose === 'POST' || purpose === 'STORY') {
      return requestedVisibility ?? 'PRIVATE';
    }

    throw new BadRequestException('unsupported media purpose');
  }

  validateMimeType(params: {
    mediaType: 'IMAGE' | 'VIDEO';
    mimeType: string;
  }) {
    const { mediaType, mimeType } = params;

    if (mediaType === 'IMAGE' && !mimeType.startsWith('image/')) {
      throw new BadRequestException('invalid image mime type');
    }

    if (mediaType === 'VIDEO' && !mimeType.startsWith('video/')) {
      throw new BadRequestException('invalid video mime type');
    }
  }
}
