import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/users";
import Group from "@/models/group";

export const POST = async (req) => {
    const request = await req.json();
    console.log("Looking for groups for user:", request.email);
    
    try {
        await connect();
        
        // Get the user and their group keys
        const user = await User.findOne({ email: request.email });
        if (!user || !user.groupprikeys) {
            console.log("User not found or has no groups");
            return Response.json([]);
        }
        
        // Extract group IDs from the user's groupprikeys
        const groupIds = user.groupprikeys.map(item => item.id);
        console.log("User has keys for groups:", groupIds);
        
        // Verify which groups actually exist in the Group collection
        const existingGroups = await Group.find({ 
            name: { $in: groupIds } 
        }).select('name');
        
        const existingGroupNames = existingGroups.map(group => group.name);
        console.log("Groups that actually exist:", existingGroupNames);
        
        // Clean up user's groupprikeys by removing references to deleted groups
        if (existingGroupNames.length < groupIds.length) {
            console.log("Cleaning up user's group references...");
            // Filter out group keys that don't exist anymore
            const updatedGroupKeys = user.groupprikeys.filter(item => 
                existingGroupNames.includes(item.id)
            );
            
            // Update the user document
            await User.findOneAndUpdate(
                { email: request.email },
                { groupprikeys: updatedGroupKeys }
            );
            
            console.log("User's group references cleaned up");
        }
        
        return Response.json(existingGroupNames);
    } catch (e) {
        console.error("Error fetching groups:", e);
        return Response.json({ error: e.message }, { status: 500 });
    }
};
