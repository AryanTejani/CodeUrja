import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    
    name:{
        type:String,
        required:true,
    },
    folderId:{
        type:String
    },
    publickey:{
        type:String,
    },
    userEmails:{
        type:Array
    },
    ownerId:{
        type:String
    },
    privatekey:{
        type:String
    }

})

const Group = mongoose.models.groups || mongoose.model("groups", groupSchema);

export default Group;