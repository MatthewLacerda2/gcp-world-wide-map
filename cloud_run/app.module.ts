import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hop } from './hop/entities/hop.entity';
import { HopModule } from './hop/hop.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // modify as needed
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'mydb',
      entities: [Hop],
      synchronize: true, // use migrations in prod
    }),
    HopModule,
  ],
})
export class AppModule {}
