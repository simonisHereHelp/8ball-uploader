// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Centralized NextAuth configuration
 * - Uses Google OAuth only
 * - Enforces single account (99.cent.bagel@gmail.com)
 * - Shows account picker every time
 * - Uses JWT-based sessions (no DB adapter needed)
 */

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
          prompt: "select_account", // always ask which Google account to use
        },
      },
    }),
  ],

  // Use JWT session strategy for stateless deployment on Vercel
  session: { strategy: "jwt" },

  // Required secret for signing cookies / JWTs
  secret: process.env.AUTH_SECRET,

  /**
   * Callbacks: control sign-in / JWT / session behaviors
   */
  callbacks: {
    /**
     * signIn:
     *  - return `true` to allow
     *  - return URL string to redirect
     */
  async signIn({ user }) {
    return user?.email === "99.cent.bagel@gmail.com";
    },

    /**
     * jwt: runs whenever a token is issued or updated.
     * Optional: we just pass through here.
     */
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    /**
     * session: adds email/name/image into the session object.
     */
    async session({ session, token }) {
      if (token?.email) {
        session.user = {
          ...session.user,
          email: token.email,
          name: token.name,
          image: token.picture,
        };
      }
      return session;
    },
  },
});
