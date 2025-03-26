"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Link from "next/link";
import { gsap } from "gsap";
import Navbar from "../../Navbar/Navbar"

export default function Group(props) {
  const session = useSession();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteInProgress, setDeleteInProgress] = useState(null);

  // Refs for animations
  const headerRef = useRef(null);
  const userListRef = useRef(null);

  useEffect(() => {
    if (session.status === "authenticated") {
      fetchUsers();
    }

    // Animate header and content
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [session.status]);

  useEffect(() => {
    // Animate user list when users are loaded
    if (userListRef.current && users.length > 0) {
      gsap.fromTo(
        userListRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [users]);

  async function fetchUsers() {
    if (!session.data?.user?.email) return;

    setIsLoading(true);
    try {
      const res = await axios.post("/api/group/showuser", {
        name: props.params.group,
        email: session.data.user.email,
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteUser(email) {
    setDeleteInProgress(email);
    try {
      const res = await axios.post("/api/group/deleteuser", {
        name: props.params.group,
        email: email,
        owner: session.data.user.email,
      });

      if (res.status === 200) {
        // Animate out the removed user
        const userElement = document.getElementById(
          `user-${email.replace(/[@.]/g, "-")}`
        );
        if (userElement) {
          gsap.to(userElement, {
            opacity: 0,
            x: -50,
            duration: 0.5,
            onComplete: () => {
              setUsers(users.filter((u) => u !== email));
            },
          });
        } else {
          setUsers(users.filter((u) => u !== email));
        }
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeleteInProgress(null);
    }
  }

  if (session.status === "loading") {
    return (
     
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white py-12 px-4">
       <Navbar/>
      <div className="max-w-4xl mt-10 mx-auto">
        <div ref={headerRef} className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {props.params.group} Group
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Manage group members. Only listed users can access the group's
            encrypted files.
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-3 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Group Members
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              No members in this group
            </div>
          ) : (
            <ul ref={userListRef} className="space-y-4">
              {users.map((email) => (
                <li
                  key={email}
                  id={`user-${email.replace(/[@.]/g, "-")}`}
                  className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 flex justify-between items-center hover:bg-gray-700/50 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-600/20 p-2 rounded-full mr-4">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="text-white">{email}</span>
                  </div>
                  <button
                    onClick={() => deleteUser(email)}
                    disabled={deleteInProgress === email}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-300 flex items-center"
                  >
                    {deleteInProgress === email ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Removing
                      </div>
                    ) : (
                      "Remove"
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between">
            <Link
              href="/group"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors duration-300 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Groups
            </Link>

            <Link
              href={`/${props.params.group}`}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Go to Files
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700 text-gray-300">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">
              Only users listed here have access to the encrypted files in this
              group.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
