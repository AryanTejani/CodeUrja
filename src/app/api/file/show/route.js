import Group from "@/models/group";
import { connect } from "@/dbConfig/dbConfig";
import axios from "axios";
import User from "@/models/users";
export const POST =async(req)=>{
    const request=await req.json()
    try{
        connect();

        const grpexist=await Group.findOne({name:request.name});
        if(grpexist===null){
            throw new Error("grp doesnt exists")
        }
        const user=await User.findOne({email:request.email});
        if(user===null || !grpexist.userEmails.includes(user.email)){
            throw new Error("u r not authorised doesnt exists")
        }
        const data =await axios.get(`https://www.googleapis.com/drive/v3/files?q='${grpexist.folderId}' in parents & trashed=false`,{

        headers:{
            Authorization:`Bearer ${user.access_token}`, 
            'Content-Type': 'application/json',
            Accept:'application/json',
        }})
        return Response.json(data.data.files);
    }
    catch(e){console.log(e);
        return Response.json(e)};
    return Response.json('ok');
}