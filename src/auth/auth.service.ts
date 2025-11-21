import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const hashedPassword = await hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
        role: registerDto.role || 'USER',
        password: hashedPassword,
      },
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto, mfaCode?: string) {
    // Support both email and username login
    // If input doesn't contain @, treat as username and convert to email format
    let email = loginDto.email;
    if (!email.includes('@')) {
      // Username format: convert to email
      email = `${email}@stefanos.com`;
    }

    // Try to find user by email with retry logic
    let user = await retryOperation(
      () => this.prisma.user.findUnique({
        where: { email },
      }),
      'Find user by email',
      this.prisma,
    );

    // If not found and it was a username, also try to find by name
    if (!user && !loginDto.email.includes('@')) {
      user = await retryOperation(
        () => this.prisma.user.findFirst({
          where: { name: loginDto.email },
        }),
        'Find user by name',
        this.prisma,
      );
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
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      token,
    };
  }

  async enableMFA(userId: string, enableMFADto: EnableMFADto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (enableMFADto.type === MFAType.TOTP) {
      const { secret, qrCodeUrl } = MFAUtil.generateTOTPSecret(user.email);
      const backupCodes = MFAUtil.generateBackupCodes();

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
          mfaBackupCodes: backupCodes,
        },
      });

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
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          emailVerified: true, // Assume email is verified if enabling email MFA
        },
      });

      return {
        success: true,
        message: 'Email MFA enabled. OTP will be sent to your email on login.',
      };
    }

    throw new BadRequestException('Invalid MFA type');
  }

  async disableMFA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    });

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
      return await MFAUtil.verifyEmailOTP(this.prisma, user.id, code);
    }
  }

  async sendEmailOTP(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      throw new BadRequestException('User email not found');
    }

    const otp = MFAUtil.generateEmailOTP();
    await MFAUtil.storeOTP(this.prisma, userId, otp);

    // TODO: Send email with OTP
    // In production, use a service like SendGrid, AWS SES, etc.
    console.log(`Email OTP for ${user.email}: ${otp}`); // Remove in production

    return {
      success: true,
      message: 'OTP sent to email',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  private generateToken(payload: { userId: string; email: string; role: string }): string {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    return this.jwtService.sign(payload, {
      expiresIn: expiresIn as any,
    });
  }
}

