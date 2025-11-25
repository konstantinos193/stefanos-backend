import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { MongoDBService } from '../../database/mongodb.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private mongo: MongoDBService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(payload.userId);
    
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: this.mongo.fromObjectId(user._id),
      userId: this.mongo.fromObjectId(user._id), // For compatibility
      email: user.email,
      role: user.role,
    };
  }
}

