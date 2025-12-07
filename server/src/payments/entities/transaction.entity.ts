import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    PURCHASE = 'purchase',
    REWARD = 'reward',
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    amount: number;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}
