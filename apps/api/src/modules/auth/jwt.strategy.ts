import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_credit_shop_jwt_key_2026_change_in_production',
    });
  }

  async validate(payload: any) {
    if (payload.isCustomer) {
      // Customer Portal Payload
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });
      if (!customer || !customer.isActive) {
        throw new UnauthorizedException('Customer account not found or inactive');
      }
      return {
        id: customer.id,
        phone: customer.phone,
        fullName: customer.fullName,
        role: 'CUSTOMER',
        isCustomer: true,
        customerId: customer.id,
      };
    }

    // Staff / Owner Payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account not found or deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isCustomer: false,
    };
  }
}
