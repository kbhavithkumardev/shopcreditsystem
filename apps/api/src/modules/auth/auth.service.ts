import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, CustomerLoginDto, RegisterUserDto } from './auth.dto';
import { RoleType } from '@credit-shop/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAndLoginUser(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.phoneOrEmail },
          { phone: dto.phoneOrEmail },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive. Please contact shop owner.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isCustomer: false,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async customerLogin(dto: CustomerLoginDto) {
    // Phone-first Customer Portal login
    const customer = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
      include: { village: true },
    });

    if (!customer) {
      throw new UnauthorizedException('No customer account found with this phone number');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Customer account is deactivated');
    }

    const payload = {
      sub: customer.id,
      phone: customer.phone,
      fullName: customer.fullName,
      role: RoleType.CUSTOMER,
      isCustomer: true,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken: token,
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phone: customer.phone,
        villageName: customer.village.name,
      },
    };
  }

  async registerUser(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('A user with this phone or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role as any,
      },
    });

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
