import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FilterQuery, Model } from 'mongoose';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';

@Controller('records')
export class RecordController {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO): Promise<Record> {
    return await this.recordModel.create({
      artist: request.artist,
      album: request.album,
      price: request.price,
      qty: request.qty,
      format: request.format,
      category: request.category,
      mbid: request.mbid,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 500, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new InternalServerErrorException('Record not found');
    }

    Object.assign(record, updateRecordDto);

    const updated = await this.recordModel.updateOne(record);
    if (!updated) {
      throw new InternalServerErrorException('Failed to update record');
    }

    return record;
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Page size for pagination (default: 20)',
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort by: relevance (text search), price, or created',
    enum: ['relevance', 'price', 'created'],
  })
  async findAll(
    @Query('q') q?: string,
    @Query('artist') artist?: string,
    @Query('album') album?: string,
    @Query('format') format?: RecordFormat,
    @Query('category') category?: RecordCategory,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('sort') sort: 'relevance' | 'price' | 'created' = 'relevance',
  ): Promise<Record[]> {
    const query: FilterQuery<Record> = {};

    if (artist) query.artist = new RegExp(artist, 'i');
    if (album) query.album = new RegExp(album, 'i');
    if (format) query.format = format;
    if (category) query.category = category;
    if (q) query.$text = { $search: q } as any;

    const projection = q
      ? {
          score: { $meta: 'textScore' },
          artist: 1,
          album: 1,
          price: 1,
          qty: 1,
          format: 1,
          category: 1,
        }
      : {
          artist: 1,
          album: 1,
          price: 1,
          qty: 1,
          format: 1,
          category: 1,
        };

    let cursor = this.recordModel.find(query, projection).lean();
    if (sort === 'relevance' && q) {
      cursor = cursor.sort({ score: { $meta: 'textScore' } });
    } else if (sort === 'price') {
      cursor = cursor.sort({ price: 1 });
    } else if (sort === 'created') {
      cursor = cursor.sort({ created: -1 });
    }

    const results = await cursor
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .exec();

    return results as any;
  }
}
