import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
const express = require('express');

let cachedServer: express.Express | undefined;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    app.enableCors();
    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function (req: any, res: any) {
  const server = await bootstrap();
  server(req, res);
}
