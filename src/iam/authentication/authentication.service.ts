import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { HashingService } from '../hashing/hashing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly hashingService: HashingService,
		private readonly jwtService: JwtService,
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
	) {}
	async signUp(signUpDto: SignUpDto) {
		try {
			const user = new User();
			user.email = signUpDto.email;
			user.password = await this.hashingService.hash(signUpDto.password);
			await this.userRepository.save(user);
		} catch (err) {
			if (err.code === '23505') throw new ConflictException();
			throw err;
		}
	}
	async signIn(signInDto: SignInDto) {
		const user = await this.userRepository.findOneBy({
			email: signInDto.email,
		});
		if (!user) throw new ConflictException();
		if (
			!(await this.hashingService.compare(
				signInDto.password,
				user.password,
			))
		) {
			throw new ConflictException();
		}
		const accessToken = this.jwtService.sign(
			{
				sub: user.id,
				email: user.email,
			},
			{
				secret: this.jwtConfiguration.secret,
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
				expiresIn: this.jwtConfiguration.accessTokenTtl,
			},
		);
		return {
			id: user.id,
			email: user.email,
			accessToken,
		};
	}
}
