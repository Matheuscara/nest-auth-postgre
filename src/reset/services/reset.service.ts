import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reset } from '../entitys/reset.entity';

@Injectable()
export class ResetService {
  constructor(
    @InjectRepository(Reset)
    private resetRepository: Repository<Reset>,
  ) {}

  async save(body) {
    return this.resetRepository.save(body);
  }

  async findOne(options) {
    return await this.resetRepository.findOne(options);
  }

  async expireToken(id, body) {
    return await this.resetRepository.update(id, body);
  }
}
