import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';

@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
	constructor(
		private readonly authenticationService: AuthenticationService,
	) {}

	@Post('sign-up')
	signUp(@Body() signUpDto: SignUpDto) {
		return this.authenticationService.signUp(signUpDto);
	}
	@HttpCode(200)
	@Post('sign-in')
	signIn(@Body() signInDto: SignUpDto) {
		return this.authenticationService.signIn(signInDto);
	}
}
