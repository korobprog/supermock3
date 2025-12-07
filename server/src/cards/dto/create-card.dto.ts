import { IsString, IsArray, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCardDto {
    @IsString()
    @IsNotEmpty()
    profession: string;

    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @IsDateString()
    datetime: string;
}
