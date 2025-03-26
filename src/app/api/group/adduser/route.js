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
  console.log("Request received:", request);

  try {
    await connect();
    console.log("Connected to database");

    // Find the group
    const group = await Group.findOne({ name: request.name });
    console.log("Group found:", group ? "Yes" : "No");

    if (!group) {
      console.log("Group doesn't exist");
      return Response.json({ message: "Group doesn't exist" }, { status: 404 });
    }

    // Check if requestor is a member of the group
    if (!group.userEmails.includes(request.owner)) {
      console.log("Requestor is not a member of the group");
      return Response.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Find the group owner
    const owner = await User.findOne({ id: group.ownerId });
    console.log("Owner found:", owner ? "Yes" : "No");

    if (!owner) {
      console.log("Group owner not found");
      return Response.json(
        { message: "Group owner not found" },
        { status: 404 }
      );
    }

    // Find the user to add
    const user = await User.findOne({ email: request.email });
    console.log("User to add found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User to add doesn't exist");
      return Response.json({ message: "User doesn't exist" }, { status: 404 });
    }

    // Check if user is already a member
    if (group.userEmails.includes(user.email)) {
      console.log("User is already a member of the group");
      return Response.json(
        { message: "User is already a member of this group" },
        { status: 400 }
      );
    }

    console.log("Using owner's access token for permission sharing");

    try {
      // Use the OWNER's access token to share the folder, not the new user's token
      const shareResponse = await axios.post(
        `https://www.googleapis.com/drive/v3/files/${group.folderId}/permissions`,
        {
          type: "user",
          role: "writer",
          emailAddress: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${owner.access_token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Drive permission added successfully:", shareResponse.data);
    } catch (driveError) {
      console.error(
        "Google Drive API error:",
        driveError.response?.data || driveError.message
      );

      // Check if token expired
      if (driveError.response?.status === 401) {
        return Response.json(
          {
            message: "Access token expired. Please log in again.",
            error: "token_expired",
          },
          { status: 401 }
        );
      }

      return Response.json(
        {
          message: "Failed to share Google Drive folder",
          error: driveError.response?.data?.error || driveError.message,
        },
        { status: 500 }
      );
    }

    // Add user to group in database
    await Group.findOneAndUpdate(
      { name: request.name },
      { $addToSet: { userEmails: user.email } }
    );
    console.log("User added to group in database");

    // Handle encryption key sharing
    try {
      // Get owner private key
      const ownerPrivateKey = aes
        .decrypt(owner.encryptedprivatekey, process.env.NEXTAUTH_SECRET)
        .toString(Latin1);

      // Decrypt group private key with owner's private key
      const groupPrivateKey = aes
        .decrypt(group.privatekey, ownerPrivateKey)
        .toString(Latin1);

      // Encrypt group private key with new user's public key
      const userPrivateKey = aes
        .decrypt(user.encryptedprivatekey, process.env.NEXTAUTH_SECRET)
        .toString(Latin1);

      const encryptedGroupKeyForUser = aes
        .encrypt(groupPrivateKey, userPrivateKey)
        .toString();

      // Add encrypted group key to user's profile
      await User.findOneAndUpdate(
        { email: request.email },
        {
          $addToSet: {
            groupprikeys: { id: group.name, key: encryptedGroupKeyForUser },
          },
        }
      );

      console.log("Encryption keys shared successfully");
    } catch (cryptoError) {
      console.error("Encryption error:", cryptoError);
      // Continue anyway since the folder permission is granted
    }

    return Response.json(
      { message: "User added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in add user API:", error);
    return Response.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
};
