"use client";
import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <div className="navbar">
      <div className="container">
        <div className="logoo">
          <a href="/">
            <Image
              src={logo}
              alt="Drive Protector Logo"
              width={150} // Specify width
              height={50} // Specify height
              priority // Helps with initial page load
            />
          </a>
        </div>
        <ul className="nav-links">
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/approach">Approach</a>
          </li>
        </ul>
        <div className="action-buttons">
          {status === "authenticated" && (
            <>
              <a href="/group">
                <button type="button" className="btn login">
                  Group
                </button>
              </a>
              <button
                type="button"
                onClick={() => signOut()}
                className="btn login"
              >
                Logout
              </button>
              {session.user?.name && <h3>{session.user.name}</h3>}
            </>
          )}

          {status === "unauthenticated" && (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="btn login"
            >
              Login/Signin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
