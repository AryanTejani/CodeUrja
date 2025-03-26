import { connect } from "@/dbConfig/dbConfig";
import axios from "axios";
import User from "@/models/users";
import Group from "@/models/group";


export const POST=async(req)=>{
    const request=await req.json();
    console.log(request);

    try{
        await connect();
        
        
        const grp=await Group.findOne({name:request.name});
        if(grp===null || !grp.userEmails.includes(request.email))throw new Error ("no such grp found");
        return Response.json(grp.userEmails);
    }
    catch(e){
        console.log(e)
        return Response.json('err',{status:500})
    }

    return Response.json('ok');
    
}