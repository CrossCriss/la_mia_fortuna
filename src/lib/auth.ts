import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { parseIdentifier } from "@/lib/identifier";

// PrismaAdapter лінкує Google-акаунт до User (таблиця Account), але сесії — JWT,
// а не БД (наявність CredentialsProvider примушує session.strategy = "jwt";
// це офіційно підтримувана комбінація — просто DB-сесії для credentials-логіну
// не мають сенсу, бо authorize() сам перевіряє пароль без адаптера).
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/account/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Телефон або email", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const parsed = parseIdentifier(credentials.identifier);
        if (parsed.type === "invalid") return null;

        const user = await prisma.user.findUnique({
          where: parsed.type === "phone" ? { phone: parsed.value } : { email: parsed.value },
        });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(credentials.password, user.passwordHash)) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Без цього NextAuth мовчки (без запису в лог) блокує вхід через Google,
      // якщо email з Google-акаунту вже зареєстрований у нас через
      // телефон/email+пароль (кидає AccountNotLinkedError ще ДО звернення до
      // адаптера — див. node_modules/next-auth/core/lib/callback-handler.js).
      // Для цього продукту (клієнтський кабінет інтернет-магазину, а не
      // банк/корпоративний SSO) підтверджений Google-email — достатній доказ
      // володіння поштою, тож дозволяємо автоматично прив'язати Google до
      // вже існуючого акаунту з тим самим email замість жорсткої відмови.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
