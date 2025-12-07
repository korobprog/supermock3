import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        @InjectRepository(PurchaseRequest)
        private purchaseRequestRepository: Repository<PurchaseRequest>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async addPoints(userId: string, amount: number, description?: string): Promise<Transaction> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        user.points += amount;
        await this.usersRepository.save(user);

        const transaction = this.transactionsRepository.create({
            userId,
            amount,
            type: TransactionType.DEPOSIT,
            description,
        });

        return this.transactionsRepository.save(transaction);
    }

    async deductPoints(userId: string, amount: number, description?: string): Promise<Transaction> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (user.points < amount) {
            throw new BadRequestException('Insufficient points');
        }

        user.points -= amount;
        await this.usersRepository.save(user);

        const transaction = this.transactionsRepository.create({
            userId,
            amount: -amount,
            type: TransactionType.WITHDRAWAL,
            description,
        });

        return this.transactionsRepository.save(transaction);
    }

    async getTransactions(userId: string): Promise<Transaction[]> {
        return this.transactionsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getAllTransactions(): Promise<any[]> {
        const transactions = await this.transactionsRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        // Remove password from user objects
        return transactions.map(t => {
            if (t.user) {
                const { password, ...userWithoutPassword } = t.user;
                return {
                    ...t,
                    user: userWithoutPassword,
                };
            }
            return t;
        });
    }

    async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
        return this.transactionsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    // Purchase Request methods
    async createPurchaseRequest(userId: string, amount: number, description?: string): Promise<PurchaseRequest> {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }

        const request = this.purchaseRequestRepository.create({
            userId,
            amount,
            description,
            status: PurchaseRequestStatus.PENDING,
        });

        return this.purchaseRequestRepository.save(request);
    }

    async getPurchaseRequests(userId: string): Promise<PurchaseRequest[]> {
        return this.purchaseRequestRepository.find({
            where: { userId },
            relations: ['user', 'processedBy'],
            order: { createdAt: 'DESC' },
        });
    }

    async getAllPurchaseRequests(): Promise<any[]> {
        const requests = await this.purchaseRequestRepository.find({
            relations: ['user', 'processedBy'],
            order: { createdAt: 'DESC' },
        });
        // Remove password from user objects
        return requests.map(r => ({
            ...r,
            user: r.user ? (() => {
                const { password, ...userWithoutPassword } = r.user;
                return userWithoutPassword;
            })() : undefined,
            processedBy: r.processedBy ? (() => {
                const { password, ...userWithoutPassword } = r.processedBy;
                return userWithoutPassword;
            })() : undefined,
        }));
    }

    async approvePurchaseRequest(requestId: string, adminId: string, adminNotes?: string): Promise<PurchaseRequest> {
        const request = await this.purchaseRequestRepository.findOne({
            where: { id: requestId },
            relations: ['user'],
        });

        if (!request) {
            throw new NotFoundException('Purchase request not found');
        }

        if (request.status !== PurchaseRequestStatus.PENDING) {
            throw new BadRequestException('Request is not pending');
        }

        // Add points to user
        await this.addPoints(request.userId, request.amount, `Purchase request approved: ${request.description || 'No description'}`);

        // Update request status
        request.status = PurchaseRequestStatus.APPROVED;
        request.processedById = adminId;
        if (adminNotes) {
            request.adminNotes = adminNotes;
        }

        return this.purchaseRequestRepository.save(request);
    }

    async rejectPurchaseRequest(requestId: string, adminId: string, adminNotes?: string): Promise<PurchaseRequest> {
        const request = await this.purchaseRequestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Purchase request not found');
        }

        if (request.status !== PurchaseRequestStatus.PENDING) {
            throw new BadRequestException('Request is not pending');
        }

        request.status = PurchaseRequestStatus.REJECTED;
        request.processedById = adminId;
        if (adminNotes) {
            request.adminNotes = adminNotes;
        }

        return this.purchaseRequestRepository.save(request);
    }

    async deletePurchaseRequest(requestId: string, userId: string): Promise<void> {
        const request = await this.purchaseRequestRepository.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Purchase request not found');
        }

        if (request.userId !== userId) {
            throw new BadRequestException('You can only delete your own requests');
        }

        if (request.status !== PurchaseRequestStatus.PENDING) {
            throw new BadRequestException('You can only delete pending requests');
        }

        await this.purchaseRequestRepository.remove(request);
    }
}
