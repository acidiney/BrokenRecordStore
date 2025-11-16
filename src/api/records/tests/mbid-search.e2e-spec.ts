import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import {
  MUSIC_METADATA_SERVICE,
  MusicMetadataService,
} from '@/contexts/records/application/services/music-metadata.service';
import { MBID } from '@/contexts/records/domain/value-objects/mbid.vo';

describe('RecordController MBID search (e2e)', () => {
  let app: INestApplication;

  describe('returns MBID when found', () => {
    beforeEach(async () => {
      const mockService: Partial<MusicMetadataService> = {
        fetchTrackInfosByMbid: async () => [],
        searchReleaseMbid: async () =>
          MBID.from('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d'),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(MUSIC_METADATA_SERVICE)
        .useValue(mockService)
        .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      await app.init();
    });

    it('POST /records/mbid/search returns mbid string', async () => {
      const res = await request(app.getHttpServer())
        .post('/records/mbid/search')
        .send({ artist: 'The Beatles', album: 'Abbey Road' })
        .expect(200);
      expect(res.body).toHaveProperty('mbid');
      expect(typeof res.body.mbid).toBe('string');
      expect(res.body.mbid).toBe('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d');
    });

    afterAll(async () => {
      await app.close();
    });
  });

  describe('returns null when not found', () => {
    beforeEach(async () => {
      const mockService: Partial<MusicMetadataService> = {
        fetchTrackInfosByMbid: async () => [],
        searchReleaseMbid: async () => null,
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(MUSIC_METADATA_SERVICE)
        .useValue(mockService)
        .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      await app.init();
    });

    it('POST /records/mbid/search returns mbid=null', async () => {
      const res = await request(app.getHttpServer())
        .post('/records/mbid/search')
        .send({ artist: 'Unknown', album: 'Missing' })
        .expect(200);
      expect(res.body).toHaveProperty('mbid');
      expect(res.body.mbid).toBeNull();
    });

    afterAll(async () => {
      await app.close();
    });
  });
});
