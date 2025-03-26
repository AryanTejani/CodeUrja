// In your models/group.js
import mongoose from "mongoose";

// Log the schema definition
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a group name"],
    unique: true,
  },
  userEmails: {
    type: [String],
    required: [true, "Please provide at least one user email"],
  },
  publickey: {
    type: String,
    required: [true, "Please provide a public key"],
  },
  privatekey: {
    type: String,
    required: [true, "Please provide a private key"],
  },
  folderId: {
    type: String,
    required: [true, "Please provide a folder ID"],
  },
  ownerId: {
    type: String,
    required: [true, "Please provide an owner ID"],
  },
  filePassword: {
    type: String,
    required: [true, "Please provide a file password"],
  },
});

console.log("Group schema paths:", Object.keys(groupSchema.paths));

const Group = mongoose.models.groups || mongoose.model("groups", groupSchema);
export default Group;
