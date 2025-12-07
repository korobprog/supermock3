import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Card]),
        UsersModule,
    ],
    controllers: [CardsController],
    providers: [CardsService],
    exports: [CardsService],
})
export class CardsModule { }
