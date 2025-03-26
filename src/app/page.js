"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation";
import axios from "axios"
import Link from "next/link";
import { useState } from "react";
import { redirect } from "next/dist/server/api-utils";
import Navbar from "./Navbar/Navbar"
import Home1 from "./Home/Home1.js"
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import About from "./about/page.js"
import Approach from "./approach/page.js";
import Group from "./group/page.js"
import File from "./[file]/page.js"
import Download from "./download/page.js"


export default function Home() {
   

   return(
      <>
      <Navbar/>
      <Home1/>
      </>
   )

}