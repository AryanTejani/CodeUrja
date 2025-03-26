import React from 'react';
import './Signup.css';
import logo from "../../assets/Logo.png"
import {Link} from "react-router-dom";

function Signup() {
  return (
    <div className="signup-container">
        <Link to="/" >
        <img src={logo}></img>
        </Link>
      <h1 className="page-title">Sign Up</h1>
      <div className="form-container">
        <form className="signup-form">
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email address" />

          <label>Username</label>
          <input type="text" placeholder="Enter your username" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <label>Confirm Password</label>
          <input type="password" placeholder="Confirm your password" />

          <button className="signup-button">Sign Up</button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
