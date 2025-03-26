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
import path from "path";
import fs from "fs";
import multer from "multer";
import os from "os";
const rsa = new RSA();
const crypt=new Crypt();

export const POST=async(req)=>{
    const request=await req.json();
    try{
        connect();
        const grpexist=await Group.findOne({name:request.name});
        if(grpexist===null || !grpexist.userEmails.includes(request.email))throw new Error("no grp");
        const user=await User.findOne({email:request.email});
        for(let i=0;i<user.groupprikeys.length;i++){
            if(user.groupprikeys[i].id===request.name){
                try{
                const decryptedkey=aes.decrypt(user.groupprikeys[i].key,aes.decrypt(user.encryptedprivatekey,process.env.NEXTAUTH_SECRET).toString(Latin1)).toString(Latin1);
                const fileInfo = await axios.get(
                    `https://www.googleapis.com/drive/v3/files/${request.fileid}`,
                    {
                      headers: {
                        authorization: `Bearer ${user.access_token}`,
                      },
                    }
                  );
                  const downloadPath = path.join(os.tmpdir(),fileInfo.data.name + ".encrypted");
                  const location = fs.createWriteStream(downloadPath);
      
                  const file = await axios.get(
                  `https://www.googleapis.com/drive/v3/files/${request.fileid}?alt=media`,

                  {
                      headers: {
                      authorization: `Bearer ${user.access_token}`,
                      },
                      responseType: "stream",
                  }
                  );
        

                  await new Promise(function (resolve) {
                    file.data.pipe(location);
                    file.data.on("end", resolve);
                    });
  
                    const encryptedFile = await fs.promises.readFile(downloadPath);
                    const encryptedFileString = encryptedFile.toString();
        
                    const fileDecrypted = crypt.decrypt(
                    decryptedkey,
                    encryptedFileString.toString()
                    );


  
                    const verify = crypt.verify(
                        grpexist.publickey.toString(),
                        fileDecrypted.signature,
                        fileDecrypted.message
                    );
    
                        if (!verify) {
                        
                        fs.unlink(downloadPath, (err) => {
                            if (err) {
                            console.error(err);
                            return;
                            }
                            
                        });
                
                        } else {
                        const decryptedFilePath = path.join(os.tmpdir(), fileInfo.data.name);
                
                        await fs.promises.writeFile(
                            decryptedFilePath,
                            fileDecrypted.message,
                            "hex"
                        );
              
              
                        const decryptedBuffer = (await fs.promises.readFile(decryptedFilePath)).toString();
                        const datasend = {
                            data:{
                            datafile:decryptedBuffer
                            },
                            headers:{
                            "Content-Type": fileInfo.data.mimeType,
                            "Name": fileInfo.data.name
    
                            }
    
                        }
              
                        fs.unlink(decryptedFilePath, (err) => {
                            if (err) {
                            console.error(err);
                            return;
                            }
                            // File removed
                        });
                        return Response.json(datasend);
                        }
                    }
                    catch(e){
                        console.log(e)
                    }
            }
         
        }
        
        throw new Error("couldnt download");
    }
    catch(e){
        return Response.json(e);
    }
    return Response.json('ok');
}
    