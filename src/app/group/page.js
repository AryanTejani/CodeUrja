"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image.js";
import { Link } from "react-router-dom";
import logo from "../../../public/logo.png";
import Navbar from "../Navbar/Navbar.js";
import "../group/Group.css";

export default function Group() {
  const [grpname, setgrpname] = useState("");
  let [mapgrps, mapusers, mapfiles] = "";
  const [emails, setEmail] = useState(null);
  const [grps, setgrps] = useState();
  const [users, setusers] = useState();
  console.log(grpname);

  const session = useSession();
  console.log("session ", session);

  const handlechange = (e) => {
    setgrpname(e.target.value);
  };

  async function send() {
    console.log("groupname ", grpname);
    const res = axios.post("/api/group/create", {
      name: grpname,
      email: session.data.user.email,
    });
    console.log("creategroup ", res);
  }
  async function deletegrp(i) {
    const res = await axios.post("/api/group/delete", {
      name: i,
      owner: session.data.user.email,
    });
  }
  async function deleteuser(i, i1) {
    const res = await axios.post("/api/group/deleteuser", {
      name: i,
      email: i1,
      owner: session.data.user.email,
    });
  }
  async function showusers(i) {
    const res = await axios.post("/api/group/showuser", {
      name: i,
      email: session.data.user.email,
    });
    setusers(res.data);
    // (res.data).map((i1,ind)=>{
    //     <li key={ind}>
    //     {i1}
    //     <button onClick={()=>deleteuser(i,i1)}>delete</button>
    //     </li>
    // })
    console.log(res.data);
  }
  async function adduser(i) {
    if (emails === null) return false;
    const res = await axios.post("/api/group/adduser", {
      name: i,
      email: emails,
      owner: session.data.user.email,
    });
  }
  async function showfiles(i) {
    const res = await axios.post("/api/file/show", {
      name: i,
      email: session.data.user.email,
    });
    mapfiles = res.data.map((i1, ind) => {
      <li key={ind}>
        {i1}
        <button>download file</button>
      </li>;
    });
  }
  async function search() {
    const res = await axios.post("/api/group/showgrp", {
      email: session.data.user.email,
    });
    console.log("!", res.data);
    setgrps(res.data);

    console.log("!!", grps);
  }
  console.log(emails);
  if (session.status === "unauthenticated") {
    return <div>You are not Logged In</div>;
  }
  if (session.status === "authenticated") {
    return (
      <>
        <Navbar />
        <div className="group-container">
          <div className="group-header">
            <h1 className="group-creation-message">Create Group</h1>
          </div>

          <div className="group-actions">
            <input
              type="text"
              className="group-name-input"
              placeholder="Enter Group Name"
              onChange={handlechange}
            />
            <button className="create-group-button" onClick={() => send()}>
              Create Group
            </button>
          </div>
          <div className="group-list">
            <button type="submit" onClick={() => search()}>
              Existing Groups
            </button>
            <ul className="group-list-items">
              {Array.isArray(grps) &&
                grps.map((name, i) => (
                  <li id={i}>
                    <p> {name} </p>
                    <div>
                      <a className="go-to-group-button" href={name}>
                        Go
                      </a>
                      <button onClick={() => deletegrp(name)}>delete</button>
                      <a href={"/delete/" + name}>showusers</a>
                      {/* {Array.isArray(users)&&users.map((email,i)=>(
                        <li id={i}>
                            <h1>{email}</h1>
                        </li>
                    ))} */}
                      <input
                        type="email"
                        placeholder="email to add"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button onClick={() => adduser(name)}>add user</button>
                    </div>

                    {/* <input type="file"placeholder="add filename" onChange={e=>setFile(e.target.files[0])}/> */}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </>
    );
  }
}
