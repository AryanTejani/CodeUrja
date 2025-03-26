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
      return Response.json(
        { error: "Group not found or you're not authorized to access it" },
        { status: 403 }
      );
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
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Find the correct group key
    let foundKey = false;
    let decryptedkey = null;

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
          decryptedkey = aes
            .decrypt(user.groupprikeys[i].key, userPrivateKey)
            .toString(Latin1);

          console.log("Keys decrypted successfully");
          break;
        } catch (e) {
          console.error("Error decrypting keys:", e);
          return Response.json(
            { error: "Failed to decrypt keys" },
            { status: 500 }
          );
        }
      }
    }

    if (!foundKey || !decryptedkey) {
      console.log("Group key not found for user");
      return Response.json(
        { error: "You don't have access to this group's files" },
        { status: 403 }
      );
    }

    try {
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

      // Add error handling for decryption
      let fileDecrypted;
      try {
        console.log("Decrypting file...");
        fileDecrypted = crypt.decrypt(decryptedkey, encryptedFileString);
        console.log("File decrypted successfully");

        // ADD THESE DEBUGGING LINES RIGHT HERE AFTER DECRYPTION
        console.log(
          "Decrypted file message length:",
          fileDecrypted.message.length
        );

        // Check the first 20 bytes of the decrypted file (in hex)
        const firstBytes = fileDecrypted.message.substring(0, 40); // 20 bytes in hex = 40 characters
        console.log("First bytes of decrypted file (hex):", firstBytes);

        // If it's a PDF, the first bytes should represent "%PDF-1." in hex
        const pdfSignature = "255044462d312e"; // "%PDF-1." in hex
        if (fileInfo.data.mimeType === "application/pdf") {
          console.log(
            "Is PDF signature present:",
            firstBytes.startsWith(pdfSignature)
          );
        }

        // Check for common encryption artifacts
        if (
          fileDecrypted.message.includes("hybrid-crypto-js") ||
          fileDecrypted.message.includes("cipher")
        ) {
          console.log(
            "WARNING: Encryption artifacts found in decrypted content"
          );
        }
        // END OF DEBUGGING ADDITIONS
      } catch (decryptError) {
        console.error("File decryption failed:", decryptError);

        // Clean up the temporary file
        fs.unlink(downloadPath, (err) => {
          if (err) console.error("Error deleting encrypted file:", err);
        });

        return Response.json(
          { error: "Failed to decrypt file. The file may be corrupted." },
          { status: 500 }
        );
      }

      // Verify the file signature with better error handling
      console.log("Verifying file signature...");
      let verify;
      try {
        verify = crypt.verify(
          grpexist.publickey.toString(),
          fileDecrypted.signature,
          fileDecrypted.message
        );
      } catch (verifyError) {
        console.error("Error during signature verification:", verifyError);
        verify = false;
      }

      if (!verify) {
        console.log("File signature verification failed");
        fs.unlink(downloadPath, (err) => {
          if (err) console.error("Error deleting encrypted file:", err);
        });
        return Response.json(
          {
            error:
              "File signature verification failed. The file may have been tampered with.",
          },
          { status: 400 }
        );
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

      // Write the file to disk for debugging
      await fs.promises.writeFile(decryptedFilePath, buffer);
      console.log(
        "Decrypted file written to disk, size:",
        buffer.length,
        "bytes"
      );

      // For binary files, we need to send base64
      const base64Data = buffer.toString("base64");
      console.log("Base64 data length:", base64Data.length);

      // Ensure we're setting the correct MIME type
      let mimeType = fileInfo.data.mimeType || "application/octet-stream";
      // If the MIME type is missing but we can guess from filename
      if (!fileInfo.data.mimeType && fileInfo.data.name) {
        const ext = path.extname(fileInfo.data.name).toLowerCase();
        if (ext === ".pdf") mimeType = "application/pdf";
        else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".png") mimeType = "image/png";
        else if (ext === ".txt") mimeType = "text/plain";
        // Add more types as needed
      }

      // Prepare the response
      const datasend = {
        success: true,
        data: {
          datafile: base64Data,
          isBase64: true,
          fileSize: buffer.length,
        },
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${fileInfo.data.name}"`,
          Name: fileInfo.data.name,
        },
      };

      // REPLACE THE FILE CLEANUP CODE WITH THIS IMPROVED VERSION
      try {
        // Check if files exist before deleting
        if (fs.existsSync(decryptedFilePath)) {
          fs.unlinkSync(decryptedFilePath);
          console.log("Decrypted file deleted successfully");
        }
      } catch (err) {
        console.error("Error deleting decrypted file:", err);
      }

      try {
        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
          console.log("Encrypted file deleted successfully");
        }
      } catch (err) {
        console.error("Error deleting encrypted file:", err);
      }
      // END OF IMPROVED CLEANUP CODE

      console.log("File download process completed successfully");
      return Response.json(datasend);
    } catch (e) {
      console.error("Error during file processing:", e);

      // More detailed error response
      let errorMessage = "Error processing file";
      if (e.response && e.response.data) {
        errorMessage = `Google Drive error: ${
          e.response.data.error || JSON.stringify(e.response.data)
        }`;
      } else if (e.message) {
        errorMessage = e.message;
      }

      return Response.json({ error: errorMessage }, { status: 500 });
    }
  } catch (e) {
    console.error("Download error:", e);
    return Response.json(
      { error: e.message || "Download failed" },
      { status: 500 }
    );
  }
};
