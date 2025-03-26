"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image.js";
import Navbar from "../Navbar/Navbar.js";
import "../group/Group.css";

export default function Group() {
  const [grpname, setgrpname] = useState("");
  const [filePassword, setFilePassword] = useState("");
  let [mapgrps, mapusers, mapfiles] = "";
  const [emails, setEmail] = useState(null);
  const [grps, setgrps] = useState([]);
  const [users, setusers] = useState();
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const session = useSession();
  console.log("session ", session);

  // Load groups when component mounts
  useEffect(() => {
    if (session.status === "authenticated") {
      search();
    }
  }, [session.status]);

  const handlechange = (e) => {
    setgrpname(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setFilePassword(e.target.value);
  };

  async function send() {
    console.log("groupname ", grpname);

    // Validate password
    if (!filePassword) {
      setPasswordError("File password is required");
      return;
    }

    if (filePassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordError(""); // Clear any previous errors
    setIsLoading(true);

    try {
      const res = await axios.post("/api/group/create", {
        name: grpname,
        email: session.data.user.email,
        filePassword: filePassword, // Send the file password to the server
      });

      console.log("creategroup ", res);

      // Clear the form after successful creation
      if (res.status === 200) {
        setgrpname("");
        setFilePassword("");
        // Refresh the group list
        search();
      }
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deletegrp(i) {
    try {
      setIsLoading(true);
      const res = await axios.post("/api/group/delete", {
        name: i,
        owner: session.data.user.email,
      });

      // Refresh the group list after deletion
      if (res.status === 200) {
        search();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function showusers(i) {
    try {
      const res = await axios.post("/api/group/showuser", {
        name: i,
        email: session.data.user.email,
      });
      setusers(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Error showing users:", error);
    }
  }

  async function adduser(i) {
    if (emails === null) return false;
    try {
      const res = await axios.post("/api/group/adduser", {
        name: i,
        email: emails,
        owner: session.data.user.email,
      });
    } catch (error) {
      console.error("Error adding user:", error);
    }
  }

  async function deleteuser(i, i1) {
    try {
      const res = await axios.post("/api/group/deleteuser", {
        name: i,
        email: i1,
        owner: session.data.user.email,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  async function showfiles(i) {
    try {
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
    } catch (error) {
      console.error("Error showing files:", error);
    }
  }

  async function search() {
    try {
      setIsLoading(true);
      // Clear existing groups first
      setgrps([]);

      console.log("Fetching groups for email:", session.data.user.email);

      const res = await axios.post("/api/group/showgrp", {
        email: session.data.user.email,
      });

      console.log("Raw API response:", res);
      console.log("Groups data from API:", res.data);

      if (Array.isArray(res.data)) {
        console.log("Setting groups state with:", res.data);
        setgrps(res.data);
      } else if (res.data && typeof res.data === "object" && res.data.error) {
        // Handle case where API returns an error object
        console.error("API returned an error:", res.data.error);
        setgrps([]);
        // Optionally show error to user
        // toast.error(`Error loading groups: ${res.data.error}`);
      } else {
        console.error(
          "Expected array of groups, got:",
          typeof res.data,
          res.data
        );
        setgrps([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);

      // Enhanced error reporting
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);

        // Log the error details for debugging
        if (error.response.data && error.response.data.error) {
          console.error("Server error message:", error.response.data.error);
          // Optionally show error to user
          // toast.error(`Server error: ${error.response.data.error}`);
        }
      } else if (error.request) {
        console.error("No response received from server");
        // Optionally show error to user
        // toast.error("No response from server. Please check your connection.");
      } else {
        console.error("Error setting up request:", error.message);
      }

      setgrps([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Updated session status handling with better feedback
  if (session.status === "loading") {
    return (
      <div className="loading-container">Loading session information...</div>
    );
  } else if (session.status === "unauthenticated") {
    return (
      <div className="unauthenticated-container">
        <h2>Authentication Required</h2>
        <p>You need to be logged in to access this page.</p>
        <button onClick={() => signIn()}>Sign In</button>
      </div>
    );
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
            <div className="input-group">
              <input
                type="text"
                className="group-name-input"
                placeholder="Enter Group Name"
                value={grpname}
                onChange={handlechange}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                className="file-password-input"
                placeholder="Enter File Password (for secure downloads)"
                value={filePassword}
                onChange={handlePasswordChange}
              />
              {passwordError && (
                <p className="password-error">{passwordError}</p>
              )}
              <small className="password-helper-text">
                This password will be required when downloading files from this
                group
              </small>
            </div>

            <button
              className="create-group-button"
              onClick={() => send()}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Group"}
            </button>
          </div>

          <div className="group-list">
            <div className="group-list-header">
              <button
                type="submit"
                onClick={() => search()}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Existing Groups"}
              </button>
              <button
                className="refresh-button"
                onClick={() => search()}
                disabled={isLoading}
                title="Refresh group list"
              >
                🔄
              </button>
            </div>

            {isLoading && <p className="loading-text">Loading groups...</p>}

            <ul className="group-list-items">
              {Array.isArray(grps) && grps.length > 0
                ? grps.map((name, i) => (
                    <li key={i}>
                      <p> {name} </p>
                      <div className="group-actions-row">
                        <a className="go-to-group-button" href={name}>
                          Go
                        </a>
                        <button
                          className="delete-button"
                          onClick={() => deletegrp(name)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                        <a href={"/delete/" + name}>Show Users</a>
                        <div className="add-user-form">
                          <input
                            type="email"
                            placeholder="Email to add"
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <button
                            onClick={() => adduser(name)}
                            disabled={isLoading}
                          >
                            Add User
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                : !isLoading && (
                    <p>No groups found. Create a new group to get started.</p>
                  )}
            </ul>
          </div>
        </div>
      </>
    );
  }
}
