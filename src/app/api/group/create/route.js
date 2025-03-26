import { connect } from "@/dbConfig/dbConfig";
import { RSA } from "hybrid-crypto-js";
import aes from "crypto-js/aes";

import axios from "axios";
import User from "@/models/users";
import Group from "@/models/group";
import Latin1 from "crypto-js/enc-latin1";

const rsa = new RSA();

export const POST = async (req) => {
  const request = await req.json();
  console.log("Received request:", request);

  try {
    await connect();
    const grpexist = await Group.exists({ name: request.name });
    if (grpexist) {
      throw new Error("grp exists");
    }

    const user = await User.findOne({ email: request.email });
    console.log("User:", user.email);

    const folder = await axios.post(
      `https:www.googleapis.com/drive/v3/files?access_token=${user.access_token}`,
      {
        name: request.name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [user.folderId],
      },
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("Folder created:", folder.data.id);
    console.log("Password to be used:", request.filePassword);

    // Convert the callback-based RSA key generation to a Promise
    const generateKeyPairAsync = () => {
      return new Promise((resolve) => {
        rsa.generateKeyPair(function (keyPair) {
          resolve(keyPair);
        });
      });
    };

    // Wait for key generation
    const keyPair = await generateKeyPairAsync();

    const grppublickey = keyPair.publicKey.toString();
    const decrptuserPrivatekey = aes
      .decrypt(user.encryptedprivatekey, process.env.NEXTAUTH_SECRET)
      .toString(Latin1);
    const grpprivatekey = aes
      .encrypt(keyPair.privateKey, decrptuserPrivatekey)
      .toString();

    // Create the group with all required fields
    const newGrpr = await Group.create({
      name: request.name,
      folderId: folder.data.id,
      publickey: grppublickey,
      privatekey: grpprivatekey,
      userEmails: [user.email],
      ownerId: user.id,
      filePassword: request.filePassword || "default123", // Ensure a default if missing
    });

    console.log("Group created with password:", newGrpr.filePassword);

    // Update user with group key
    await User.findOneAndUpdate(
      { email: user.email },
      { $push: { groupprikeys: { id: newGrpr.name, key: grpprivatekey } } }
    );

    return Response.json({
      success: true,
      message: "Group created successfully",
      name: newGrpr.name,
    });
  } catch (e) {
    console.error("Error creating group:", e);
    return Response.json(
      { error: e.message || "Error creating group" },
      { status: 500 }
    );
  }
};
