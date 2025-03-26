import Group from "@/models/group";
import User from "@/models/users";
import { Crypt } from "hybrid-crypto-js";
import aes from "crypto-js/aes";
import { RSA } from "hybrid-crypto-js";
import CryptoJS from "crypto-js";
import { Utf8 } from "crypto-js/enc-utf8";
import Latin1 from "crypto-js/enc-latin1";
import { connect } from "@/dbConfig/dbConfig";
import axios from "axios";
import path from "path";
import fs from "fs";
import os from "os";

const rsa = new RSA();
const crypt = new Crypt();

export const POST = async (req) => {
  const request = await req.json();
  console.log("Download request received:", {
    name: request.name,
    fileId: request.fileid,
    email: request.email,
    hasPassword: !!request.password,
  });

  try {
    await connect();

    const grpexist = await Group.findOne({ name: request.name });
    if (grpexist === null || !grpexist.userEmails.includes(request.email)) {
      console.log("Group not found or user not authorized");
      throw new Error("Group not found or you're not authorized to access it");
    }

    // Check if password is provided
    if (!request.password) {
      return Response.json({ error: "Password required" }, { status: 401 });
    }

    // Verify password against stored group password
    console.log("Verifying password...");

    if (request.password !== grpexist.filePassword) {
      console.log("Password mismatch");
      return Response.json({ error: "Incorrect password" }, { status: 401 });
    }
    console.log("Password verified successfully");

    const user = await User.findOne({ email: request.email });

    // Find the correct group key
    let foundKey = false;
    for (let i = 0; i < user.groupprikeys.length; i++) {
      if (user.groupprikeys[i].id === request.name) {
        foundKey = true;
        try {
          console.log("Found group key, decrypting...");

          // Decrypt the private key
          const userPrivateKey = aes
            .decrypt(user.encryptedprivatekey, process.env.NEXTAUTH_SECRET)
            .toString(Latin1);

          // Decrypt the group key using user's private key
          const decryptedkey = aes
            .decrypt(user.groupprikeys[i].key, userPrivateKey)
            .toString(Latin1);

          console.log("Keys decrypted successfully");

          // Get file info from Google Drive
          console.log("Fetching file info from Google Drive...");
          const fileInfo = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${request.fileid}`,
            {
              headers: {
                authorization: `Bearer ${user.access_token}`,
              },
            }
          );
          console.log(
            "File info retrieved:",
            fileInfo.data.name,
            fileInfo.data.mimeType
          );

          // Create a temp path for the encrypted file
          const downloadPath = path.join(
            os.tmpdir(),
            `${fileInfo.data.id || "file"}_encrypted`
          );
          const location = fs.createWriteStream(downloadPath);

          // Download the encrypted file from Google Drive
          console.log("Downloading encrypted file from Google Drive...");
          const file = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${request.fileid}?alt=media`,
            {
              headers: {
                authorization: `Bearer ${user.access_token}`,
              },
              responseType: "stream",
            }
          );

          // Wait for the file to download completely
          await new Promise(function (resolve, reject) {
            file.data.pipe(location);
            file.data.on("end", resolve);
            file.data.on("error", reject);
            location.on("error", reject);
          });
          console.log("File downloaded to temporary location");

          // Read the encrypted file
          console.log("Reading encrypted file...");
          const encryptedFile = await fs.promises.readFile(downloadPath);
          console.log("Encrypted file size:", encryptedFile.length, "bytes");

          // Convert buffer to string for decryption
          const encryptedFileString = encryptedFile.toString();

          // Decrypt the file
          console.log("Decrypting file...");
          const fileDecrypted = crypt.decrypt(
            decryptedkey,
            encryptedFileString
          );
          console.log("File decrypted successfully");

          // Verify the file signature
          console.log("Verifying file signature...");
          const verify = crypt.verify(
            grpexist.publickey.toString(),
            fileDecrypted.signature,
            fileDecrypted.message
          );

          if (!verify) {
            console.log("File signature verification failed");
            fs.unlink(downloadPath, (err) => {
              if (err) console.error("Error deleting encrypted file:", err);
            });
            throw new Error("File signature verification failed");
          }

          console.log("File signature verified successfully");

          // Write the decrypted file to disk
          const decryptedFilePath = path.join(
            os.tmpdir(),
            `${fileInfo.data.id || "file"}_decrypted`
          );

          console.log("Writing decrypted file...");

          // Convert hex string to binary buffer
          const buffer = Buffer.from(fileDecrypted.message, "hex");
          await fs.promises.writeFile(decryptedFilePath, buffer);

          console.log(
            "Decrypted file written to disk, size:",
            buffer.length,
            "bytes"
          );

          // For binary files like PDFs, we need to send base64
          const base64Data = buffer.toString("base64");
          console.log("Base64 data length:", base64Data.length);

          // Prepare the response
          const datasend = {
            data: {
              datafile: base64Data,
              isBase64: true,
            },
            headers: {
              "Content-Type": fileInfo.data.mimeType,
              Name: fileInfo.data.name,
            },
          };

          // Clean up temporary files
          fs.unlink(decryptedFilePath, (err) => {
            if (err) console.error("Error deleting decrypted file:", err);
          });

          fs.unlink(downloadPath, (err) => {
            if (err) console.error("Error deleting encrypted file:", err);
          });

          console.log("File download process completed successfully");
          return Response.json(datasend);
        } catch (e) {
          console.error("Error during file processing:", e);
          throw e;
        }
      }
    }

    if (!foundKey) {
      console.log("Group key not found for user");
      throw new Error("You don't have access to this group's files");
    }

    throw new Error("Couldn't download file");
  } catch (e) {
    console.error("Download error:", e);
    return Response.json(
      { error: e.message || "Download failed" },
      { status: 500 }
    );
  }
};
