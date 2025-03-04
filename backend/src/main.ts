import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {ValidationPipe} from "@nestjs/common";
import * as path from "path";
import {promises as fsPromises} from "fs";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, process.env.NODE_ENV === "development" ? {
        cors: {
            allowedHeaders: ["Cookie", "Content-Type"],
            credentials: true,
            origin: "http://localhost:3000",
        }
    } : undefined);

    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
        .setTitle("BMC")
        .setDescription('BMC for servers.re146.dev')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);

    if (process.env.NODE_ENV === "development") {
        await fsPromises.writeFile(path.join(process.cwd(), "openapi.json"), JSON.stringify(document, null, 4));
    }

    SwaggerModule.setup('swagger', app, document, {
        useGlobalPrefix: true
    });

    await app.listen(3001);
}

bootstrap();
