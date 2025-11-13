// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",  // get a refresh token on first consent
          response_type: "code",
          scope: [
            "openid",
            "profile",
            "email",
            "https://www.googleapis.com/auth/drive.file", // <– allow upload
          ].join(" "),
        },
      },
    }),
  ],

  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      // still enforce single account
      return user?.email === "99.cent.bagel@gmail.com";
    },

    async jwt({ token, user, account }) {
      if (account) {
        // store Drive-enabled access token
        token.accessToken = account.access_token;
        // (optional) token.refreshToken = account.refresh_token;
      }

      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.email) {
        session.user = {
          ...session.user,
          email: token.email,
          name: token.name,
          image: token.picture,
        };
      }

      // expose access token on session for server-side routes
      session.accessToken = token.accessToken;

      return session;
    },
  },
});
