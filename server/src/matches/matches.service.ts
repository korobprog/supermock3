import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import { Card, CardStatus } from '../cards/entities/card.entity';

// Match limits per subscription plan
const FREE_PLAN_MATCH_LIMIT = 3;

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(Card)
        private cardsRepository: Repository<Card>,
    ) { }

    async create(createMatchDto: CreateMatchDto, requester: User): Promise<Match> {
        const card = await this.cardsRepository.findOne({ where: { id: createMatchDto.cardId }, relations: ['owner'] });

        if (!card) {
            throw new NotFoundException('Card not found');
        }

        // Convert to string for comparison to avoid type issues
        const cardOwnerId = String(card.ownerId);
        const requesterId = String(requester.id);

        if (cardOwnerId === requesterId) {
            throw new BadRequestException('Cannot request match for your own card');
        }

        if (card.status !== CardStatus.OPEN) {
            throw new BadRequestException('Card is not open for matching');
        }

        // Check if match already exists
        const existingMatch = await this.matchesRepository.findOne({
            where: { cardId: card.id, requesterId: requester.id },
        });

        if (existingMatch) {
            throw new BadRequestException('Match request already sent');
        }

        // Check for subscription limits
        if (requester.status === UserStatus.FREE) {
            // Count user's matches (as requester)
            const userMatchesCount = await this.matchesRepository.count({
                where: { requesterId: requester.id },
            });

            if (userMatchesCount >= FREE_PLAN_MATCH_LIMIT) {
                throw new BadRequestException(
                    `Free plan limit reached. You can create up to ${FREE_PLAN_MATCH_LIMIT} matches. Upgrade to Pro for unlimited matches.`
                );
            }
        }
        // Pro users have unlimited matches, no check needed

        const match = this.matchesRepository.create({
            card,
            cardId: card.id,
            requester,
            requesterId: requester.id,
        });

        return this.matchesRepository.save(match);
    }

    async findAllForUser(userId: string): Promise<Match[]> {
        const matches = await this.matchesRepository.find({
            where: [
                { requesterId: userId },
                { card: { ownerId: userId } }
            ],
            relations: ['card', 'card.owner', 'requester'],
            order: { createdAt: 'DESC' },
        });

        // Manually load contacts for confirmed matches
        for (const match of matches) {
            if (match.status === MatchStatus.CONFIRMED) {
                if (match.requesterId === userId) {
                    // User is requester, load owner's contacts
                    const owner = await this.matchesRepository.manager.findOne(User, {
                        where: { id: match.card.ownerId },
                        select: ['id', 'contacts'],
                    });
                    if (owner && match.card.owner) {
                        match.card.owner.contacts = owner.contacts;
                    }
                } else {
                    // User is owner, load requester's contacts
                    const requester = await this.matchesRepository.manager.findOne(User, {
                        where: { id: match.requesterId },
                        select: ['id', 'contacts'],
                    });
                    if (requester && match.requester) {
                        match.requester.contacts = requester.contacts;
                    }
                }
            }
        }

        return matches;
    }

    async update(id: string, updateMatchDto: UpdateMatchDto, userId: string): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['card'],
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Only allow participants to update
        if (match.requesterId !== userId && match.card.ownerId !== userId) {
            throw new UnauthorizedException('You are not a participant in this match');
        }

        Object.assign(match, updateMatchDto);
        return this.matchesRepository.save(match);
    }

    async confirm(id: string, userId: string): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['card']
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (match.card.ownerId !== userId) {
            throw new BadRequestException('Only card owner can confirm match');
        }

        if (match.status !== MatchStatus.PENDING) {
            throw new BadRequestException('Match is not pending');
        }

        match.status = MatchStatus.CONFIRMED;
        await this.matchesRepository.save(match);

        // Update card status
        await this.cardsRepository.update(match.cardId, { status: CardStatus.MATCHED });

        return match;
    }

    async cancel(id: string, userId: string): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['card']
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Only allow participants to cancel
        if (match.requesterId !== userId && match.card.ownerId !== userId) {
            throw new UnauthorizedException('You are not a participant in this match');
        }

        // Can only cancel pending matches
        if (match.status !== MatchStatus.PENDING) {
            throw new BadRequestException('Only pending matches can be cancelled');
        }

        match.status = MatchStatus.CANCELLED;
        await this.matchesRepository.save(match);

        return match;
    }
}
