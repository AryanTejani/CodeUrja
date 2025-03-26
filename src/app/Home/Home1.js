"use client"
import React from 'react';
import './Home.css';
import logo from '../../../public/logo.png'
import Image from 'next/image';
import Navbar from '../Navbar/Navbar';
const Home1 = () => {
  return (
    <>
    {/* <Navbar></Navbar> */}
    <div className="welcome-container">
      <h1 className="welcome-message">Welcome to </h1>
      <Image src={logo} alt="DriveProtector Logo" className="logo" />
      <h2 className="subtitle"> Ultimate Google Drive Security Solution!</h2>
      {/* <div className="button-container">
        <button className="login-button">Login</button>
        <button className="signup-button">Sign Up</button>
        <button className="about-button">About Us</button>
      </div> */}
    </div>
    </>
    
  );
};

export default Home1;
