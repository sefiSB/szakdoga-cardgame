const request = require("supertest");
const { app } = require("../../index");
const { User } = require("../../models");
const { testlobbies } = require("../testmemory/testlobbies");
const bcrypt = require("bcryptjs");

describe("User API Tests", () => {
 
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user=await User.create({
      username: "testuser",
      email: "asdasdasd@asdasdasd.com",
      password: hashedPassword,
    });
  })

  afterEach(async () => {
    await User.destroy({
      where: {
        username: "testuser",
      },
    });
  })

  describe("GET /users/:id", () => {
    test("should return user data", async () => {
      const user = await User.findOne({
        where: {
          username: "testuser",
        },
      });
      const response = await request(app).get(`/users/${user.id}`);
      expect(response.body.username).toBe("testuser");
    });

    test("should log in", async () => {
      
      

      const response = await request(app)
        .post("/loginuser")
        .send({
          name: "testuser",
          password: "password123",
        })
        

      expect(response.body.username).toBe("testuser");

    });

    test("user not found", async () => {
      const response = await request(app).post("/loginuser").send({
        name: "nonexistentuser",
        password: "password123",
      });
      expect(response.body.error).toBe("User not found!");
    });

    test("wrong password", async () => {
      

      const response = await request(app)
        .post("/loginuser")
        .send({
          name: "testuser",
          password: "wrongpassword",
        })
        

      expect(response.body.error).toBe("Password is incorrect!");

      
    });

    test("register with good data", async () => {
      const response = await request(app).post("/adduser").send({
        name: "testusertest",
        email: "aaaaa@aaa.aa",
        password: "password123",
      })
      expect(response.body.username).toBe("testusertest");

      await User.destroy({
        where: {
          username: "testusertest",
        },
      });
    });

  });
});
