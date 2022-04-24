import { LoginThrottler } from './login.throttler';
import { JwtAuthService } from "./jwt-auth.service";
import { User } from 'src/models/user';
import { UserRepository } from "../repositories/user.repository";

const fakeUser = {
  email: 'bartosz@app.com',
  password: '123',
  confirmed: true,
} as User;

const loginThrottlerStub = (user = fakeUser) => {
  return {
    isLoginBlocked: jest.fn(() => Promise.resolve(user))
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
      const jwtAuthService = new JwtAuthService(loginThrottlerStub(), userRepoStub());
      const result = jwtAuthService.authenticate();
      expect(typeof result).toBe('function');
    });
  });

  describe('login method', () => {

  });

  describe('logout', () => { });

  describe('getCurrentUser', () => { })
})
