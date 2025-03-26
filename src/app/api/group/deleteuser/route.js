import { connect } from "@/dbConfig/dbConfig";
import axios from "axios";
import User from "@/models/users";
import Group from "@/models/group";

export const POST = async (req) => {
  const request = await req.json();
  console.log("Delete user request:", request);

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

    // Find the user to delete
    const userToDelete = await User.findOne({ email: request.email });
    console.log("User to delete found:", userToDelete ? "Yes" : "No");

    if (!userToDelete) {
      console.log("User to delete doesn't exist");
      return Response.json({ message: "User doesn't exist" }, { status: 404 });
    }

    // Find the group owner (to use their token)
    const owner = await User.findOne({ id: group.ownerId });
    console.log("Owner found:", owner ? "Yes" : "No");

    if (!owner) {
      console.log("Group owner not found");
      return Response.json(
        { message: "Group owner not found" },
        { status: 404 }
      );
    }

    // Check if user is actually in the group
    if (!group.userEmails.includes(userToDelete.email)) {
      console.log("User is not a member of this group");
      return Response.json(
        { message: "User is not a member of this group" },
        { status: 400 }
      );
    }

    try {
      // Get permissions using OWNER's token
      console.log("Getting folder permissions");
      const permsResponse = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${group.folderId}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${owner.access_token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Find the permission ID for the user to delete
      const permissionToDelete = permsResponse.data.permissions.find(
        (perm) => perm.emailAddress === request.email
      );

      if (!permissionToDelete) {
        console.log("Permission not found for user");
        // Continue anyway since we'll remove from DB
      } else {
        // Delete the permission using OWNER's token
        console.log("Deleting Drive permission:", permissionToDelete.id);
        await axios.delete(
          `https://www.googleapis.com/drive/v3/files/${group.folderId}/permissions/${permissionToDelete.id}`,
          {
            headers: {
              Authorization: `Bearer ${owner.access_token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        console.log("Drive permission deleted successfully");
      }
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

      // Continue anyway since we want to remove from DB even if Drive API fails
      console.log("Continuing with database updates despite Drive API error");
    }

    // Remove user from group in database
    console.log("Removing user from group in database");
    const updatedEmails = group.userEmails.filter(
      (email) => email !== request.email
    );

    await Group.findOneAndUpdate(
      { name: request.name },
      { userEmails: updatedEmails }
    );

    // Remove group key from user's profile
    console.log("Removing group key from user's profile");
    const updatedKeys = userToDelete.groupprikeys.filter(
      ({ id }) => id !== group.name
    );

    await User.findOneAndUpdate(
      { email: request.email },
      { groupprikeys: updatedKeys }
    );

    console.log("User successfully removed from group");
    return Response.json(
      { message: "User removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in delete user API:", error);
    return Response.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
};
