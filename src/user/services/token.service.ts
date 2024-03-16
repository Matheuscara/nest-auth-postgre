import { Injectable } from '@nestjs/common';
import { Token } from '../entitys/token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    protected readonly tokenRepository: Repository<Token>,
  ) {}

  async save(body) {
    return this.tokenRepository.save(body);
  }

  async findOne(options) {
    return await this.tokenRepository.findOne(options);
  }

  async delete(options) {
    return await this.tokenRepository.delete(options);
  }
}
