import { test, expect, describe } from "bun:test";
import { SkillLoadError } from "./errors";

describe("SkillLoadError", () => {
  describe("constructor", () => {
    test("creates error with message", () => {
      const error = new SkillLoadError("test error");

      expect(error).toBeInstanceOf(SkillLoadError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("test error");
      expect(error.name).toBe("SkillLoadError");
    });

    test("creates error with message and cause", () => {
      const cause = new Error("original error");
      const error = new SkillLoadError("wrapped error", { cause });

      expect(error.message).toBe("wrapped error");
      expect(error.cause).toBe(cause);
    });
  });

  describe("wrapError", () => {
    test("returns same error if already SkillLoadError", () => {
      const original = new SkillLoadError("original error");
      const wrapped = SkillLoadError.wrapError(original);

      expect(wrapped).toBe(original);
    });

    test("wraps Error instance with message preserved", () => {
      const original = new Error("file not found");
      const wrapped = SkillLoadError.wrapError(original);

      expect(wrapped).toBeInstanceOf(SkillLoadError);
      expect(wrapped.message).toBe("file not found");
      expect(wrapped.cause).toBe(original);
    });

    test("wraps string as error message", () => {
      const wrapped = SkillLoadError.wrapError("something went wrong");

      expect(wrapped).toBeInstanceOf(SkillLoadError);
      expect(wrapped.message).toBe("something went wrong");
      expect(wrapped.cause).toBe("something went wrong");
    });

    test("wraps non-Error objects by converting to string", () => {
      const wrapped = SkillLoadError.wrapError({ code: 404, msg: "not found" });

      expect(wrapped).toBeInstanceOf(SkillLoadError);
      expect(wrapped.message).toBe("[object Object]");
    });

    test("wraps null as string", () => {
      const wrapped = SkillLoadError.wrapError(null);

      expect(wrapped).toBeInstanceOf(SkillLoadError);
      expect(wrapped.message).toBe("null");
      expect(wrapped.cause).toBe(null);
    });

    test("wraps undefined as string", () => {
      const wrapped = SkillLoadError.wrapError(undefined);

      expect(wrapped).toBeInstanceOf(SkillLoadError);
      expect(wrapped.message).toBe("undefined");
      expect(wrapped.cause).toBe(undefined);
    });

    test("preserves error chain with nested causes", () => {
      const rootCause = new Error("root cause");
      const middleError = new Error("middle error", { cause: rootCause });
      const wrapped = SkillLoadError.wrapError(middleError);

      expect(wrapped.cause).toBe(middleError);
      expect((wrapped.cause as Error).cause).toBe(rootCause);
    });
  });
});
