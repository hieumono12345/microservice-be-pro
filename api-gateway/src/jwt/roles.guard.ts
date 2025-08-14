import { CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !this.roles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này.');
    }

    return true;
  }
}
