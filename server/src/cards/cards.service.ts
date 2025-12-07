import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CardsService {
    constructor(
        @InjectRepository(Card)
        private cardsRepository: Repository<Card>,
        private usersService: UsersService,
    ) { }

    async create(createCardDto: CreateCardDto, userPayload: any): Promise<Card> {
        // Получаем полный объект User из базы данных
        const user = await this.usersService.findOne(userPayload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const card = this.cardsRepository.create({
            ...createCardDto,
            owner: user,
            ownerId: user.id,
        });
        return this.cardsRepository.save(card);
    }

    async findAll(): Promise<Card[]> {
        return this.cardsRepository.find({
            where: { status: CardStatus.OPEN },
            relations: ['owner'],
            order: { datetime: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Card | null> {
        return this.cardsRepository.findOne({ where: { id }, relations: ['owner'] });
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.cardsRepository.delete({ id, ownerId: userId });
    }
}
