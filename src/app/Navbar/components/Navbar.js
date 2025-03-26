"use client";
import React, { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "../../../../public/logo.png";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure rendering only happens after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create a skeleton navbar for server-side rendering
  const navbarSkeleton = (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <Image
                src={logo}
                alt="SecureShare Logo"
                width={150}
                height={50}
                priority
                className="hover:opacity-80 transition-opacity"
              />
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {/* Skeleton links */}
            <div className="w-16 h-8 bg-gray-800 rounded-md"></div>
            <div className="w-16 h-8 bg-gray-800 rounded-md"></div>
            <div className="w-16 h-8 bg-gray-800 rounded-md"></div>
          </div>
          <div className="w-24 h-10 bg-gray-800 rounded-md"></div>
        </div>
      </div>
    </nav>
  );

  // Return skeleton during server-side rendering or initial client render
  if (!isMounted) {
    return navbarSkeleton;
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <Image
                src={logo}
                alt="SecureShare Logo"
                width={150}
                height={50}
                priority
                className="hover:opacity-80 transition-opacity"
              />
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <a
              href="/about"
              className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              About
            </a>
            <a
              href="/approach"
              className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Approach
            </a>
            {/* <a
              href="/ai"
              className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Personalised Ai
            </a> */}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {status === "authenticated" && session?.user && (
              <>
                <a href="/group">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 border border-blue-500">
                    My Groups
                  </button>
                </a>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200 border border-red-500"
                >
                  Logout
                </button>
                {session.user.name && (
                  <span className="text-gray-200 text-sm font-medium bg-gray-800 px-3 py-1 rounded-full">
                    {session.user.name}
                  </span>
                )}
              </>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn("google")}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200 border border-green-500 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-1.104 0-2 .896-2 2v3h4v-3c0-1.104-.896-2-2-2zm7-2c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-1.104 0-2 .896-2 2v3h4v-3c0-1.104-.896-2-2-2zm-14 0c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-1.104 0-2 .896-2 2v3h4v-3c0-1.104-.896-2-2-2z"
                  />
                </svg>
                Secure Login
              </button>
            )}

            {status === "loading" && (
              <div className="w-24 h-10 bg-gray-800 rounded-md animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;