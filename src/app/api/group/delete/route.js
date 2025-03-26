import { connect } from "@/dbConfig/dbConfig";
import { RSA } from "hybrid-crypto-js";
import aes from "crypto-js/aes";

import axios from "axios";
import User from "@/models/users";
import Group from "@/models/group";



const rsa = new RSA();

export const POST=async(req)=>{
    const request=await req.json();
    console.log(request);
    try{
        await connect();
        const grp=await Group.findOne({name:request.name});
        const user1=await User.findOne({id:grp.ownerId});
        if(grp===null || !grp.userEmails.includes(request.owner)){
            throw new Error("grp doesnt exists");
        }
        
        // console.log(grp.folderId);
        if(grp.userEmails.length===1 && grp.userEmails[0]===request.owner){
            const deleteFolder = await axios.delete(
                `https://www.googleapis.com/drive/v3/files/${grp.folderId}`,
                {
                    headers:{
                        Authorization:`Bearer ${user1.access_token}`, 
                        'Content-Type': 'application/json',
                        Accept:'application/json',
                    } 
                }
              );
              function notgrp({id,key}){
                return id!=grp.name;
              }
            const updatedkeys= user1.groupprikeys.filter(notgrp);
            await User.findOneAndUpdate({id:grp.ownerId},{groupprikeys:updatedkeys});

            await Group.deleteOne({_id:grp._id});
             
        }
        
    }
    catch(e){
        console.log(e)
        return Response.json('err',{status:500})
    }
    return Response.json('ok');
    
}