import assert from "node:assert/strict";
import test from "node:test";
import { securityHeaders } from "@/lib/security-headers";

function header(name: string) {
  return securityHeaders.find((item) => item.key === name)?.value;
}

test("enforces a content security policy", () => {
  const policy = header("Content-Security-Policy");

  assert.ok(policy);
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /form-action 'self'/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test("allows only supported video frame providers", () => {
  const policy = header("Content-Security-Policy");

  assert.match(policy ?? "", /https:\/\/www\.youtube\.com/);
  assert.match(policy ?? "", /https:\/\/player\.vimeo\.com/);
});

test("retains transport and MIME protections", () => {
  assert.equal(header("X-Content-Type-Options"), "nosniff");
  assert.equal(header("X-Frame-Options"), "DENY");
  assert.match(header("Strict-Transport-Security") ?? "", /includeSubDomains/);
  assert.equal(header("Cross-Origin-Opener-Policy"), "same-origin");
});
