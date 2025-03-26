"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image.js";
import { Link } from "react-router-dom";
import Navbar from "../../Navbar/Navbar.js";
import "./group.css";

export default function group(props) {
  const session = useSession();
  const [users, setusers] = useState();
  console.log("session ", session);
  console.log("props ", props.params);

  async function getusers() {
    const res = await axios.post("/api/group/showuser", {
      name: props.params.group,
      email: session.data.user.email,
    });
    setusers(res.data);
    console.log("users ", res.data);
  }
  async function deleteuser(i) {
    const res = await axios.post("/api/group/deleteuser", {
      name: props.params.group,
      email: i,
      owner: session.data.user.email,
    });
  }
  return (
    <div>
      <Navbar />
      <button onClick={() => getusers()}>Users in Group</button>
      <ul>
        {Array.isArray(users) &&
          users.map((email, i) => (
            // return(
            <li id={i}>
              <h1>{email}</h1>
              <button onClick={() => deleteuser(email)}>Delete</button>
            </li>
            // )
          ))}
      </ul>
    </div>
  );
}
