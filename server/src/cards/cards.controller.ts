import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('cards')
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createCardDto: CreateCardDto, @Request() req: any) {
        return this.cardsService.create(createCardDto, req.user);
    }

    @Get()
    findAll() {
        return this.cardsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.cardsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.cardsService.remove(id, req.user.id);
    }
}
