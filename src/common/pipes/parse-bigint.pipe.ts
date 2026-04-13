import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('invalid id');
    }

    return BigInt(value);
  }
}
