import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connect } from "@/dbConfig/dbConfig";
import { RSA } from "hybrid-crypto-js";
import aes from "crypto-js/aes";

import axios from "axios";
import User from "@/models/users";

import Latin1 from "crypto-js/enc-latin1";

const rsa = new RSA();

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Using simplified scope names where possible
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive ttps://www.googlheapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  callbacks: {
    // In your signIn callback
    async signIn({ token, user, account, profile }) {
      try {
        await connect();
        const currUser = await User.exists({
          email: user.email,
        });

        if (currUser === null) {
          // Create folder first
          const folder = await axios.post(
            `https://www.googleapis.com/drive/v3/files?access_token=${account.access_token}`,
            {
              name: "SECURE",
              mimeType: "application/vnd.google-apps.folder",
            },
            {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );
          const folderId = folder.data.id;

          // Convert callback-based RSA key generation to Promise
          const keyPair = await new Promise((resolve, reject) => {
            rsa.generateKeyPair(function (keyPair) {
              resolve(keyPair);
            });
          });

          // Now we can use the keyPair directly
          const userPublicKey = keyPair.publicKey.toString();
          const userPrivateKey = aes
            .encrypt(keyPair.privateKey, process.env.NEXTAUTH_SECRET)
            .toString();

          // Create the user and await its completion
          await User.create({
            email: user.email,
            name: user.name,
            id: user.id,
            image: user.image,
            publickey: userPublicKey,
            encryptedprivatekey: userPrivateKey,
            groupprikeys: [],
            folderId: folderId.toString(),
            access_token: account.access_token,
          });

          console.log("New user created successfully:", user.email);
        } else {
          await User.findOneAndUpdate(
            { email: user.email },
            { access_token: account.access_token }
          );
          console.log("Existing user updated:", user.email);
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Still return true to allow sign-in even if DB operations fail
        // You might want to handle this differently based on your requirements
        return true;
      }
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token;
    },
    async session({ session, user, token }) {
      return session;
    },
  },
  events: {
    async signOut({ token, session }) {
      //   session={};
      //   token={};
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
