"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import FormData from "form-data";
import Navbar from "../Navbar/Navbar";
import "./File.css"
import fileDownload from "js-file-download";


export const config = {
    api: {
      bodyParser: false,
    },
  };

export default function file(props) {

    const session=useSession();
    const [grpname,setgrpname]=useState("");
    const [file,setfile]=useState(null);
    const[mail,setmail]=useState("");
    const [files,setfiles]=useState([]);

    console.log("props ",props.params.file);

    async function upload(){
        if(file===null)return false;
        let fr=new FileReader();
        fr.readAsText(file);
        console.log("filename ",file.name);
        fr.onload=async function(){
        const buffer=Buffer.from(fr.result,'latin1');
        const bufString = buffer.toString('hex');
        
        const res=await axios.post('/api/file/upload',{
            name:props.params.file,
            fileName:file.name,
            email:session.data.user.email,
            hexfile:bufString
        })
        console.log(res)
        }

    }

    const download = async(e)=>{
        try {
            const downloadFile = await axios.post(
            "/api/file/download",{
                name:props.params.file,
                fileid:e,
                email:session.data.user.email,
            }
            )
            console.log(downloadFile,"lol")
            fileDownload(downloadFile.data.data.datafile, downloadFile.data.headers.Name);
      } catch (error) {
        console.log(error);
        setErrorStatus(true);
        setErrorMessage("Error downloading files.");
      }

    }

    const getfiles = async()=>{
        try{
            const res=await axios.post('/api/file/show',{
                name:props.params.file,
                email:session.data.user.email
            })
            setfiles(res.data);
            console.log("!files ",res.data);
            console.log("files ",files)
        }catch(error){
            console.log("cant get files ",error);
        }

    }

    const handlechange = (e)=>{
        console.log(e.target);
        setgrpname(e.target.value);
    }

    const handlefile= (e)=>{
        console.log("file ",e.target.files[0]);
        setfile(e.target.files[0]);
        // console.log("file id",file.id);
    }
    
    //console.log(grpname);
    
    if(session.status==="unauthenticated"){
        return(<div>pls authenticate</div>)
    }
    if(session.status==="authenticated"){
        console.log(session.data.user.email)
        // setmail(session.data.user.email);
        return (
    <div>
        <Navbar></Navbar>
        <div className="file-container">
        <h1 className="file-heading">Group File Upload</h1>
        <p className="file-message">Upload a file for the group.</p>

        <div className="file-actions">
            <label for="myfile">Select File</label>
            <input type="file" id="myfile" onChange={handlefile}/>
            <button className="upload-button" onClick={()=>upload()}> Upload</button>
        </div>

        <div className="file-list">
            <button type="submit" onClick={()=>getfiles()}>Get Existing Files and Documents</button>
            {Array.isArray(files)&&files.map((name,i)=>{
                return(<li id={i}>
                    <h1>{name.name}</h1>
                    <button onClick={()=>download(name.id)}>Download</button>
                </li>)
            })}
        </div>
        </div>
        

    </div>
    )}
  
}
