import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongoDBService } from '../database/mongodb.service';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { retryOperation } from '../lib/connection-retry';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EnableMFADto, VerifyMFADto, MFAType } from './dto/enable-mfa.dto';
import { MFAUtil } from './utils/mfa.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private mongo: MongoDBService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const usersCollection = this.mongo.getCollection('users');
    
    const existingUser = await usersCollection.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const hashedPassword = await hashPassword(registerDto.password);

    const userData = {
      email: registerDto.email,
      name: registerDto.name,
      phone: registerDto.phone,
      role: registerDto.role || 'USER',
      password: hashedPassword,
      isActive: true,
      mfaEnabled: false,
      emailVerified: false,
      phoneVerified: false,
      mfaBackupCodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(userData);
    const user = await usersCollection.findOne({ _id: result.insertedId });

    const token = this.generateToken({
      userId: this.mongo.fromObjectId(user!._id),
      email: user!.email,
      role: user!.role,
    });

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: this.mongo.fromObjectId(user!._id),
        email: user!.email,
        name: user!.name,
        role: user!.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto, mfaCode?: string) {
    const usersCollection = this.mongo.getCollection('users');
    
    // Support both email and username login
    // If input doesn't contain @, treat as username and convert to email format
    let email = loginDto.email;
    if (!email.includes('@')) {
      // Username format: convert to email
      email = `${email}@stefanos.com`;
    }

    // Try to find user by email
    let user = await usersCollection.findOne({ email });

    // If not found and it was a username, also try to find by name
    if (!user && !loginDto.email.includes('@')) {
      user = await usersCollection.findOne({ name: loginDto.email });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (user.password) {
      const isValidPassword = await verifyPassword(loginDto.password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return {
          success: false,
          requiresMFA: true,
          mfaType: user.mfaSecret ? MFAType.TOTP : MFAType.EMAIL,
          message: 'MFA code required',
        };
      }

      // Verify MFA code
      const isValidMFA = await this.verifyMFACode(user, mfaCode);
      if (!isValidMFA) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const token = this.generateToken({
      userId: this.mongo.fromObjectId(user._id),
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: this.mongo.fromObjectId(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      token,
    };
  }

  async enableMFA(userId: string, enableMFADto: EnableMFADto) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(userId);
    
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (enableMFADto.type === MFAType.TOTP) {
      const { secret, qrCodeUrl } = MFAUtil.generateTOTPSecret(user.email);
      const backupCodes = MFAUtil.generateBackupCodes();

      await usersCollection.updateOne(
        { _id: userObjectId },
        {
          $set: {
            mfaEnabled: true,
            mfaSecret: secret,
            mfaBackupCodes: backupCodes,
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: true,
        message: 'TOTP MFA enabled',
        qrCodeUrl,
        backupCodes, // Show only once, user should save them
        secret, // For manual entry
      };
    } else if (enableMFADto.type === MFAType.EMAIL) {
      // For email OTP, we just enable it
      // OTP will be sent on each login
      await usersCollection.updateOne(
        { _id: userObjectId },
        {
          $set: {
            mfaEnabled: true,
            emailVerified: true, // Assume email is verified if enabling email MFA
            updatedAt: new Date(),
          },
        }
      );

      return {
        success: true,
        message: 'Email MFA enabled. OTP will be sent to your email on login.',
      };
    }

    throw new BadRequestException('Invalid MFA type');
  }

  async disableMFA(userId: string) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(userId);
    
    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
          updatedAt: new Date(),
        },
      }
    );

    return {
      success: true,
      message: 'MFA disabled',
    };
  }

  async verifyMFACode(user: any, code: string): Promise<boolean> {
    if (user.mfaSecret) {
      // TOTP verification
      return MFAUtil.verifyTOTP(user.mfaSecret, code);
    } else {
      // Email OTP verification (simplified - in production use Redis/DB)
      // For now, return true as placeholder
      return await MFAUtil.verifyEmailOTP(this.mongo, this.mongo.fromObjectId(user._id), code);
    }
  }

  async sendEmailOTP(userId: string): Promise<{ success: boolean; message: string }> {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(userId);
    
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user || !user.email) {
      throw new BadRequestException('User email not found');
    }

    const otp = MFAUtil.generateEmailOTP();
    await MFAUtil.storeOTP(this.mongo, userId, otp);

    // TODO: Send email with OTP
    // In production, use a service like SendGrid, AWS SES, etc.
    console.log(`Email OTP for ${user.email}: ${otp}`); // Remove in production

    return {
      success: true,
      message: 'OTP sent to email',
    };
  }

  async getCurrentUser(userId: string) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(userId);
    
    const user = await usersCollection.findOne(
      { _id: userObjectId },
      {
        projection: {
          _id: 1,
          email: 1,
          name: 1,
          phone: 1,
          role: 1,
          avatar: 1,
          isActive: 1,
          createdAt: 1,
        },
      }
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      user: {
        id: this.mongo.fromObjectId(user._id),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  private generateToken(payload: { userId: string; email: string; role: string }): string {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn as any,
    });
  }
}

