import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const rawEmail =
          typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!rawEmail || !password || rawEmail.length > 254 || password.length > 200) {
          return null;
        }

        const normalizedEmail = rawEmail.toLowerCase();

        try {
          const [ipLimit, accountLimit] = await Promise.all([
            checkRateLimit(request, {
              namespace: "login-ip",
              limit: 20,
              windowMs: 15 * 60 * 1000,
            }),
            checkRateLimit(request, {
              namespace: "login-account",
              identifier: normalizedEmail,
              limit: 10,
              windowMs: 15 * 60 * 1000,
            }),
          ]);
          if (!ipLimit.allowed || !accountLimit.allowed) return null;
        } catch (error) {
          console.error("Login rate limit check failed", error);
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              ...(rawEmail === normalizedEmail ? [] : [{ email: rawEmail }]),
            ],
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
