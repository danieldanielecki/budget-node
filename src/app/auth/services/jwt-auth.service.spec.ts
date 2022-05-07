import { AuthRequest } from './../../../models/authRequest';
import { LoginThrottler } from './login.throttler';
import { JwtAuthService } from "./jwt-auth.service";
import { User } from 'src/models/user';
import { UserRepository } from "../repositories/user.repository";

const fakeUser = {
  email: 'bartosz@app.com',
  password: '$2y$10$k.58cTqd/rRbAOc8zc3nCupCC6QkfamoSoO2Hxq6HVs0iXe7uvS3e', // '123' - defined in InMemoryUserRepository.
  confirmed: true,
  tfa: true,
  tfaSecret: 'abc'
} as User;

const loginThrottlerStub = (blocked: boolean) => {
  return {
    isLoginBlocked: jest.fn(() => Promise.resolve(blocked))
  } as unknown as Pick<LoginThrottler, 'isLoginBlocked'> as LoginThrottler;
}

const userRepoStub = (user = fakeUser) => {
  return {
    getUserByEmail: jest.fn(() => Promise.resolve(user))
  } as Pick<UserRepository, 'getUserByEmail'> as UserRepository;
}

describe('JwtAuthService', () => {
  describe('authenticate method', () => {
    it('returns a request handler', () => {
      const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub());
      const result = jwtAuthService.authenticate();
      expect(typeof result).toBe('function');
    });
  });

  describe('login method', () => {
    it('logs in an returns the logged user', (done) => {
      const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub());
      const request = new AuthRequest('bartosz@app.com', '123', '', {});

      jwtAuthService.login(request).then((user) => {
        expect(user).toBeTruthy();
        done();
      });
    });

    it('fails to login with a wrong password', (done) => {
      const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub());
      const request = new AuthRequest('bartosz@app.com', 'wrong', '', {});

      jwtAuthService.login(request).catch(() => {
        done();
      });
    });

    it('fails to login unconfirmed user with a valid password', (done) => {
      const unconfirmedUser = { ...fakeUser, confirmed: false } as User;
      const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub(unconfirmedUser));
      const request = new AuthRequest('bartosz@app.com', '123', '', {});

      jwtAuthService.login(request).catch(() => {
        done();
      });
    });
  })
});

describe('logout method', () => {
  it('resolves Promise', (done) => {
    const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub());
    jwtAuthService.getCurrentUser().then(() => {
      done();
    })
  });
});

describe('getCurrentUser method', () => {
  it('resolves Promise', (done) => {
    const jwtAuthService = new JwtAuthService(loginThrottlerStub(true), userRepoStub());
    jwtAuthService.getCurrentUser().then(() => {
      done();
    })
  });
})
