import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AuthType } from '../../enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../../decorators/auth.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
	private static defaultAuthType = AuthType.Bearer;
	private readonly authTypeGuardMap = {
		[AuthType.Bearer]: this.accessTokenGuard,
		[AuthType.None]: { canActivate: () => true },
	};
	constructor(
		private readonly reflector: Reflector,
		private readonly accessTokenGuard: AccessTokenGuard,
	) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		// get all authtype from context, and default to Bearer(protect any route that is not decorated with Auth(None))
		const authTypes = this.reflector.getAllAndOverride(AUTH_TYPE_KEY, [
			context.getHandler(),
			context.getClass(),
		]) ?? [AuthenticationGuard.defaultAuthType];
		// for each authType found, add the corresponding authtype guard to guards, then call canActivate
		const guards = authTypes
			.map((type) => this.authTypeGuardMap[type])
			.flat();

		let error = new UnauthorizedException();
		for (const instance of guards) {
			const canActivate = await Promise.resolve(
				instance.canActivate(context),
			).catch((err) => {
				error = err;
			});
			if (canActivate) return true;
		}

		throw error;
	}
}
