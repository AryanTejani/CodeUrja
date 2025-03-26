import { connect } from "@/dbConfig/dbConfig";
import { RSA } from "hybrid-crypto-js";
import aes from "crypto-js/aes";

import axios from "axios";
import User from "@/models/users";
import Group from "@/models/group";
import Latin1 from "crypto-js/enc-latin1";



const rsa = new RSA();

export const POST=async(req)=>{
    const request=await req.json();
    console.log(request);
    try{
        await connect();
        const grpexist=await Group.exists({name:request.name});
        if(grpexist){
            throw new Error("grp exists")
        }
        const user=await User.findOne({email:request.email});
        console.log(user);
        const folder= await axios.post(`https:www.googleapis.com/drive/v3/files?access_token=${user.access_token}`,
            {
                name: request.name,
                mimeType: 'application/vnd.google-apps.folder',
                parents:[user.folderId]
            },{

                headers:{
                    Authorization:`Bearer ${user.access_token}`, 
                    'Content-Type': 'application/json',
                    Accept:'application/json',
                }
            })
            
            rsa.generateKeyPair(async function (keyPair){
              
                
  
                // console.log("public key ",mpk);
                
                const grppublickey=keyPair.publicKey.toString();
                const decrptuserPrivatekey=aes.decrypt(user.encryptedprivatekey,process.env.NEXTAUTH_SECRET).toString(Latin1);
                const grpprivatekey=aes.encrypt(keyPair.privateKey,decrptuserPrivatekey).toString();

                const newGrpr=await Group.create({
                  name:request.name,
                  folderId:folder.data.id,
                  publickey:grppublickey,
                  privatekey:grpprivatekey,
                  userEmails:user.email,
                  ownerId:user.id
                })
                await User.findOneAndUpdate(
                    {email:user.email},
                    {$push:{groupprikeys:{id:newGrpr.name,key:grpprivatekey}}})
              })
    }
    catch(e){
        console.log(e)
        return Response.json('err',{status:500})
    }
    return Response.json('ok');
    
}
