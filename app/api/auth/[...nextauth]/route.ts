import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

// Export authOptions for server-side authentication
export const authOptions: NextAuthOptions = {
  // Always include a strong secret
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug mode for both environments until fixed
  debug: true,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.username) {
        session.user.username = token.username as string;
      }
      return session;
    },
    // Add a redirect callback to ensure proper redirection
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  // Trust the Vercel domain
  trustHost: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 