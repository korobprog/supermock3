import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class UpdateMatchDto {
    @IsOptional()
    @IsEnum(MatchStatus)
    status?: MatchStatus;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    feedback?: string;
}
