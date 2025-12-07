import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMatchDto {
    @IsString()
    @IsNotEmpty()
    cardId: string;
}
