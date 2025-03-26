import Group from "@/models/group";
import User from "@/models/users";
import { Crypt } from "hybrid-crypto-js";
import aes from "crypto-js/aes";
import { RSA } from "hybrid-crypto-js";
import CryptoJS from "crypto-js";
import { Utf8 } from "crypto-js/enc-utf8";
import Latin1 from "crypto-js/enc-latin1"
import { connect } from "@/dbConfig/dbConfig";
import axios from "axios";
const rsa = new RSA();
 
const crypt=new Crypt();
export const POST=async(req)=>{
    const request =await req.json();
    console.log("!!",request);
    
    try{
        connect();
        const grpexist=await Group.findOne({name:request.name});
        if(grpexist===null || !grpexist.userEmails.includes(request.email))throw new Error ("no such grp found");
        const user=await User.findOne({email:request.email});
        
        for(let i=0;i<user.groupprikeys.length;i++){
          if(user.groupprikeys[i].id===grpexist.name){
            try{
            const decryptedkey=aes.decrypt(user.groupprikeys[i].key.toString(),aes.decrypt(user.encryptedprivatekey,process.env.NEXTAUTH_SECRET).toString(Latin1)).toString(Latin1);
            
              const signature = crypt.signature(decryptedkey,request.hexfile);
            
              console.log(grpexist.publickey.toString())
              const encfile=crypt.encrypt(
                  grpexist.publickey.toString(),
                  request.hexfile,
                  signature
              );

              const encryptedFileBuffer = Buffer.from(encfile);
                const metadata = await axios.post(
                    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
                    {
                      name: request.fileName,
                      parents: [grpexist.folderId],
                      //mimeType:'application/vnd.google-apps.shortcut'
                    },
                    {
                      headers: {
                        authorization: `Bearer ${user.access_token}`,
                        "X-Upload-Content-Type": "application/octet-stream",
                        "X-Upload-Content-Length": encryptedFileBuffer.byteLength,
                        "Content-Type": "application/json;charset=UTF-8",
                      },
                    }
                  );
                  const resp = await axios.post(
                    metadata.headers.location,
                    encryptedFileBuffer,
                    { 
                      headers: {
                        authorization: `Bearer ${user.access_token}`,
                        "Content-Type": "application/octet-stream",
                        "Content-Length": encryptedFileBuffer.byteLength,
                      },
                    }
                  );
                  return Response.json("uploaded successfully");
                  }
                  catch(e){
                    console.log(e);
                  }
              }
        }
        
    }
    catch(e){
        return Response.json(e);
    }
    return Response.json('ok');
}