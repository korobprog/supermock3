import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Card } from '../cards/entities/card.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Match, Card]),
        UsersModule,
    ],
    controllers: [MatchesController],
    providers: [MatchesService],
    exports: [MatchesService],
})
export class MatchesModule { }
