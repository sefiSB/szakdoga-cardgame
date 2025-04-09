const request = require('supertest');
const { app } = require('../../index');
const { User } = require('../../models');

describe('User API Tests', () => {
  beforeEach(async () => {
    await User.destroy({ where: {
        username: "testuser",
    } });
  });

  describe('GET /users/:id', () => {
    test('should return user data', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .expect(200);

      expect(response.body.username).toBe('testuser');
    });
  });
});