import bcrypt = require('bcryptjs');
import jwt = require('jsonwebtoken');
import CONFIG from '../../../config';
import passport from '../passport';
import { AuthService } from './auth.service';
import { LoginThrottler } from './login.throttler';
import { UserRepository } from '../repositories/user.repository';
import { AuthRequest } from './../../../models/authRequest';
import { Token } from './../../../models/token';
import { User } from './../../../models/user';
import log from './../../../utils/logger';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository';

export class JwtAuthService implements AuthService<Token> {

  constructor(private loginThrottler: LoginThrottler = new LoginThrottler(), private userRepository: UserRepository = new InMemoryUserRepository()) { }

  authenticate() {
    return passport.authenticate('jwt', { session: false });
  }

  login(loginRequest: AuthRequest): Promise<Token> {
    const email = loginRequest.email;
    return this.userRepository.getUserByEmail(email).then(user => {

      return this.loginThrottler.isLoginBlocked(email).then((isBlocked: boolean) => {
        if (isBlocked) {
          log.warn('auth.jwt_login_failed.user_blocked', { email });
          throw `Login blocked. Please try in ${CONFIG.loginThrottle.timeWindowInMinutes} minutes`;
        } else {
          return bcrypt.compare(loginRequest.password, user.password!).then(match => {
            if (match && user.confirmed) {

              const token = createSignedToken(user);
              log.info('auth.jwt_login_successful', { user });
              return { jwt: token };

            } else if (match && !user.confirmed) {

              log.info('auth.jwt_login_failed.not_confirmed', { user });
              return Promise.reject('Please confirm your user profile');

            } else {

              this.loginThrottler.registerLoginFailure(email);
              log.info('auth.jwt_login_failed.wrong_password', { user });
              return Promise.reject();

            }
          });
        }
      });

    });
  }

  logout() {
    log.info('auth.jwt_logout_successful');
    return Promise.resolve();
  }

  getCurrentUser(): Promise<void> {
    return Promise.resolve();
  }

}

function createSignedToken(user: User) {
  const payload = User.toSafeUser(user);
  return jwt.sign(payload, CONFIG.jwtSecret,
    { expiresIn: 600 }); // 600 seconds = 10 minutes
}
