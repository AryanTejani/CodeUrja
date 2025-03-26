import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connect } from "@/dbConfig/dbConfig";
import { RSA } from "hybrid-crypto-js";
import aes from "crypto-js/aes";
import axios from "axios";
import User from "@/models/users";
import Latin1 from "crypto-js/enc-latin1";

const rsa = new RSA();

// Define scopes as constants for better maintainability
const GOOGLE_SCOPES = {
  OPENID: "openid",
  EMAIL: "email",
  PROFILE: "profile",
  GMAIL_SEND: "https://www.googleapis.com/auth/gmail.send",
  DRIVE: "https://www.googleapis.com/auth/drive",
  DRIVE_FILE: "https://www.googleapis.com/auth/drive.file",
  DRIVE_APPDATA: "https://www.googleapis.com/auth/drive.appdata",
};

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Fixed scope string with corrected URLs
          scope: [
            GOOGLE_SCOPES.OPENID,
            GOOGLE_SCOPES.EMAIL,
            GOOGLE_SCOPES.PROFILE,
            GOOGLE_SCOPES.GMAIL_SEND,
            GOOGLE_SCOPES.DRIVE,
            GOOGLE_SCOPES.DRIVE_FILE,
            GOOGLE_SCOPES.DRIVE_APPDATA,
          ].join(" "),
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
    async signIn({ token, user, account, profile }) {
      try {
        await connect();
        const currUser = await User.exists({
          email: user.email,
        });

        if (currUser === null) {
          // Create folder first
          const folder = await axios.post(
            `https://www.googleapis.com/drive/v3/files`,
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
            refresh_token: account.refresh_token,
            token_expiry: new Date(
              Date.now() + (account.expires_in || 3600) * 1000
            ),
          });

          console.log("New user created successfully:", user.email);
        } else {
          await User.findOneAndUpdate(
            { email: user.email },
            {
              access_token: account.access_token,
              // Store refresh token if provided
              ...(account.refresh_token && {
                refresh_token: account.refresh_token,
              }),
              // Update token expiry
              token_expiry: new Date(
                Date.now() + (account.expires_in || 3600) * 1000
              ),
            }
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
      // Store the access token and refresh token in the JWT if available
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires =
          Date.now() + (account.expires_in || 3600) * 1000;
      }
      return token;
    },

    async session({ session, user, token }) {
      // Add access token to session if needed (be careful with exposing to client)
      session.accessToken = token.accessToken;
      return session;
    },
  },

  events: {
    async signOut({ token, session }) {
      // You could add cleanup logic here if needed
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
