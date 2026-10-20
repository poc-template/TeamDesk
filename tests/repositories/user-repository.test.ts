import { describe, expect, it } from "vitest";
import { UserRepository } from "@/lib/repositories/user-repository";
import { createTestDb } from "../helpers/test-db";

describe("UserRepository", () => {
  it("邮箱统一转小写并去空格", () => {
    const db = createTestDb();
    const user = new UserRepository(db).create({
      email: "  Admin@Uob.DEV ",
      name: "周维",
      passwordHash: "scrypt$aa$bb",
      role: "admin",
    });

    expect(user.email).toBe("admin@uob.dev");
    expect(user.role).toBe("admin");
  });

  it("默认角色是 member", () => {
    const db = createTestDb();
    const user = new UserRepository(db).create({
      email: "someone@uob.dev",
      name: "李莉",
      passwordHash: "scrypt$aa$bb",
    });

    expect(user.role).toBe("member");
  });

  it("按邮箱查询忽略大小写", () => {
    const db = createTestDb();
    const repo = new UserRepository(db);
    repo.create({ email: "lily@uob.dev", name: "李莉", passwordHash: "scrypt$aa$bb" });

    expect(repo.findByEmail("LILY@uob.dev")?.name).toBe("李莉");
    expect(repo.exists("lily@uob.dev")).toBe(true);
    expect(repo.exists("nobody@uob.dev")).toBe(false);
  });

  it("列表不包含密码哈希", () => {
    const db = createTestDb();
    const repo = new UserRepository(db);
    repo.create({ email: "a@uob.dev", name: "甲", passwordHash: "scrypt$secret$secret" });

    const [first] = repo.list();
    expect(first?.email).toBe("a@uob.dev");
    expect(first && "passwordHash" in first).toBe(false);
    expect(JSON.stringify(repo.list())).not.toContain("secret");
  });

  it("重复邮箱直接抛唯一约束错误", () => {
    const db = createTestDb();
    const repo = new UserRepository(db);
    repo.create({ email: "dup@uob.dev", name: "甲", passwordHash: "x" });

    expect(() =>
      repo.create({ email: "dup@uob.dev", name: "乙", passwordHash: "y" }),
    ).toThrow();
  });
});
