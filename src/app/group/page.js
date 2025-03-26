"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import axios from "axios";
import { gsap } from "gsap";
import Navbar from "../Navbar/Navbar.js";
import Link from "next/link";

export default function Group() {
  const [grpname, setgrpname] = useState("");
  const [filePassword, setFilePassword] = useState("");
  let [mapgrps, mapusers, mapfiles] = "";
  const [emails, setEmail] = useState(null);
  const [grps, setgrps] = useState([]);
  const [users, setusers] = useState();
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Animation refs
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const listRef = useRef(null);

  const session = useSession();
  console.log("session ", session);

  // Initialize animations after component mounts
  useEffect(() => {
    setIsClient(true);
    
    if (headerRef.current && formRef.current && listRef.current) {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      
      tl.from(headerRef.current, {
        y: -30,
        opacity: 0,
        duration: 1
      })
      .from(formRef.current.children, {
        y: 20,
        opacity: 0,
        stagger: 0.2,
        duration: 0.7
      }, "-=0.5")
      .from(listRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8
      }, "-=0.3");
    }
  }, []);

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
      setActiveGroup(i);
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
      setIsLoading(true);
      const res = await axios.post("/api/group/adduser", {
        name: i,
        email: emails,
        owner: session.data.user.email,
      });
      if (res.status === 200) {
        // Reset the email field
        setEmail(null);
        // Refresh user list if we're viewing this group
        if (activeGroup === i) {
          showusers(i);
        }
      }
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteuser(i, i1) {
    try {
      setIsLoading(true);
      const res = await axios.post("/api/group/deleteuser", {
        name: i,
        email: i1,
        owner: session.data.user.email,
      });
      if (res.status === 200 && activeGroup === i) {
        showusers(i);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsLoading(false);
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

        if (error.response.data && error.response.data.error) {
          console.error("Server error message:", error.response.data.error);
        }
      } else if (error.request) {
        console.error("No response received from server");
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading session information...</p>
        </div>
      </div>
    );
  } else if (session.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-lg max-w-md w-full">
          <div className="text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4 text-blue-300">Authentication Required</h2>
            <p className="text-gray-300 mb-6">You need to be logged in to access your secure groups.</p>
            <button 
              onClick={() => signIn("google")} 
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-medium text-white shadow-lg hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-1 border border-blue-500/30 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Secure Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (session.status === "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        <Navbar />
        
        {/* Binary code effect in background - only on client side */}
        {isClient && (
          <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none select-none">
            <div className="grid grid-cols-20 gap-0">
              {Array.from({ length: 800 }).map((_, i) => (
                <div key={i} className="text-xs text-green-500 font-mono opacity-30">
                  {Math.round(Math.random()) === 1 ? '1' : '0'}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-10">
          <div ref={headerRef} className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Secure Group Management
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Create encrypted groups to share files securely with end-to-end AES-256 encryption.
              Only authorized members with the correct password can access your files.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Group Form */}
            <div ref={formRef} className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-blue-900/10 transition-all duration-300">
                <h2 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Group
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-300 mb-1">
                      Group Name
                    </label>
                    <input
                      id="groupName"
                      type="text"
                      className="w-full px-4 py-2 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                      placeholder="Enter Group Name"
                      value={grpname}
                      onChange={handlechange}
                    />
                  </div>

                  <div>
                    <label htmlFor="filePassword" className="block text-sm font-medium text-gray-300 mb-1">
                      File Password
                    </label>
                    <input
                      id="filePassword"
                      type="password"
                      className="w-full px-4 py-2 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                      placeholder="Enter File Password"
                      value={filePassword}
                      onChange={handlePasswordChange}
                    />
                    {passwordError && (
                      <p className="mt-1 text-red-400 text-sm">{passwordError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      This password will be required when downloading files from this group
                    </p>
                  </div>

                  <button
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-medium text-white shadow-md hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 border border-blue-500/30 flex items-center justify-center"
                    onClick={() => send()}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Secure Group
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Group List */}
            <div ref={listRef} className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-blue-900/10 transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-blue-300 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Your Secure Groups
                  </h2>
                  
                  <button
                    onClick={() => search()}
                    disabled={isLoading}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center transition-colors duration-200"
                    title="Refresh group list"
                  >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="ml-1">Refresh</span>
                  </button>
                </div>

                {isLoading && (
                  <div className="flex justify-center my-8">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {!isLoading && Array.isArray(grps) && grps.length === 0 && (
                  <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-400">No groups found. Create a new group to get started.</p>
                  </div>
                )}

                {!isLoading && Array.isArray(grps) && grps.length > 0 && (
                  <div className="space-y-4">
                    {grps.map((name, i) => (
                      <div key={i} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors duration-200">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-white flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {name}
                          </h3>
                          
                          <div className="flex space-x-2">
                            <Link href={name} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors duration-200 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              Go
                            </Link>
                            
                            <button
                              onClick={() => deletegrp(name)}
                              disabled={isLoading}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors duration-200 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                            
                            <Link href={"/delete/" + name} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors duration-200 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              Users
                            </Link>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative flex-grow">
                              <input
                                type="email"
                                placeholder="Email to add to this group"
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                              </div>
                            </div>
                            <button
                              onClick={() => adduser(name)}
                              disabled={isLoading || !emails}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-medium text-white shadow-md hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 border border-blue-500/30 flex items-center justify-center whitespace-nowrap"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Add User
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
                    {/* Security notice */}
                    <div className="mt-12 max-w-3xl mx-auto bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700 relative overflow-hidden">
            {/* Encryption animation indicators - only render on client side */}
            {isClient && (
              <div className="absolute top-0 left-0 w-full h-1 flex">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-full flex-1 bg-yellow-500/10 encryption-indicator"></div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-300">
                All files shared within these groups are secured with end-to-end AES-256 encryption. 
                Only group members with the correct file password can decrypt and access the files.
              </p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-center">
              <div className="bg-green-500/20 px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-green-400 text-sm font-medium">AES-256 Encryption Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
