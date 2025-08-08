/* eslint-disable */
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly requiredRole: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) {
      throw new UnauthorizedException('User role not found');
    }
    if (user.role !== this.requiredRole) {
      throw new UnauthorizedException(`Requires ${this.requiredRole} role`);
    }
    return true;
  }
}