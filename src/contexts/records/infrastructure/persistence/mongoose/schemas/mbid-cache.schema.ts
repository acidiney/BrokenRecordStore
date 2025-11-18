import { Tracklist } from '@/contexts/records/domain/types/tracklist.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class MBIDCache extends Document {
  @Prop({ required: true, unique: true })
  mbid: string;

  @Prop({ type: [Object], required: true, default: [] })
  tracklist: Tracklist[];

  @Prop({ required: false })
  artist?: string;

  @Prop({ required: false })
  album?: string;

  @Prop({ required: false })
  coverImage?: string;

  @Prop({ required: true })
  fetchedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export type MBIDCacheDocument = MBIDCache & Document;

export const MBIDCacheSchema = SchemaFactory.createForClass(MBIDCache);

MBIDCacheSchema.index({ mbid: 1 }, { unique: true, name: 'uniq_mbid' });
MBIDCacheSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'ttl_expiresAt' },
);
MBIDCacheSchema.index({ artist: 1, album: 1 }, { name: 'idx_artist_album' });
