"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import logo from "../../../../public/sh1.png";
import { gsap } from "gsap";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navRef = useRef(null);
  const logoRef = useRef(null);
  const linksRef = useRef(null);
  const buttonsRef = useRef(null);

  // Handle animations after component mounts
  useEffect(() => {
    setIsMounted(true);

    if (isMounted) {
      // Animate navbar elements
      gsap.from(logoRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(linksRef.current?.children || [], {
        opacity: 0,
        y: -10,
        stagger: 0.1,
        duration: 0.5,
        ease: "power2.out",
      });

      gsap.from(buttonsRef.current, {
        opacity: 0,
        x: 20,
        duration: 0.8,
        ease: "power3.out",
      });
    }
  }, [isMounted]);

  // Create a skeleton navbar for server-side rendering
  const navbarSkeleton = (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <div className="w-36 h-10 bg-gray-800 rounded-md animate-pulse"></div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {/* Skeleton links */}
            <div className="w-16 h-8 bg-gray-800 rounded-md animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-800 rounded-md animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-800 rounded-md animate-pulse"></div>
          </div>
          <div className="w-28 h-10 bg-gray-800 rounded-md animate-pulse"></div>
        </div>
      </div>
    </nav>
  );

  // Return skeleton during server-side rendering or initial client render
  if (!isMounted) {
    return navbarSkeleton;
  }

  return (
    <nav
      ref={navRef}
      className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0" ref={logoRef}>
            <a href="/" className="flex items-center group">
              <Image
                src={logo}
                alt="SecureShare Logo"
                width={150}
                height={50}
                priority
                className="transition-all duration-300 group-hover:brightness-110 group-hover:scale-105 h-18 w-auto"
              />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation Links - Desktop */}
          <div
            ref={linksRef}
            className="hidden sm:flex sm:items-center sm:space-x-8"
          >
            <a
              href="/about"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium relative overflow-hidden group"
            >
              <span className="relative z-10">About</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="/approach"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium relative overflow-hidden group"
            >
              <span className="relative z-10">Approach</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="/ai"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium relative overflow-hidden group"
            >
              <span className="relative z-10">Personalised AI</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>

          {/* Action Buttons */}
          <div
            ref={buttonsRef}
            className="hidden sm:flex items-center space-x-4"
          >
            {status === "authenticated" && session?.user && (
              <>
                <a href="/group">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-blue-500/30">
                    <span className="flex items-center">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      My Groups
                    </span>
                  </button>
                </a>
                <button
                  onClick={() => signOut()}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-red-500/30"
                >
                  <span className="flex items-center">
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </span>
                </button>
                {session.user.name && (
                  <span className="text-gray-200 text-sm font-medium bg-gray-800/70 px-4 py-1.5 rounded-full border border-gray-700 shadow-inner flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-blue-400"
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
                    {session.user.name}
                  </span>
                )}
              </>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn("google")}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-green-500/30 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.7603 17.37C20.2623 18.0281 21.0377 18.4446 21.88 18.49C20.87 19.97 19.11 21 17 21C14.21 21 11.8 19.12 11.8 16.8C11.8 16 12 15.3 12.5 14.6C13 13.9 13.3 13.5 14.6 12.5C15.9 11.5 17.8 10 19.4 10C20.14 10 20.8 10.23 21.4 10.65L19.4 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.5 14.6C11 15.3 10.8 16 10.8 16.8C10.8 19.12 8.39 21 5.6 21C2.5 21 0 18.5 0 15.4C0 12.3 2.5 9.80005 5.6 9.80005C6.4 9.80005 7.2 10 7.9 10.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 7C11.3726 6.37477 10.9206 5.59392 10.6931 4.73864C10.4656 3.88336 10.4707 2.98446 10.708 2.13264C10.9452 1.28082 11.4059 0.506305 12.0401 -0.111016C12.6742 -0.728337 13.4531 -1.19337 14.3054 -1.45695C15.1577 -1.72053 16.0566 -1.77089 16.9316 -1.60271C17.8066 -1.43454 18.6281 -1.05394 19.3131 -0.498329C19.9981 0.0572838 20.5236 0.780307 20.8323 1.60134C21.141 2.42237 21.223 3.31309 21.07 4.18005"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Secure Login
              </button>
            )}

            {status === "loading" && (
              <div className="w-28 h-10 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`sm:hidden ${
          isMobileMenuOpen ? "block" : "hidden"
        } transition-all duration-300`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
          <a
            href="/about"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            About
          </a>
          <a
            href="/approach"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Approach
          </a>
          <a
            href="/ai"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Personalised AI
          </a>

          {/* Mobile buttons */}
          <div className="pt-2 pb-1">
            {status === "authenticated" && session?.user && (
              <div className="space-y-2">
                <a href="/group" className="block w-full">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    My Groups
                  </button>
                </a>
                <button
                  onClick={() => signOut()}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
                {session.user.name && (
                  <div className="text-gray-200 text-sm font-medium bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2 text-blue-400"
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
                    {session.user.name}
                  </div>
                )}
              </div>
            )}

            {status === "unauthenticated" && (
              <button
                onClick={() => signIn("google")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.4 15C19.1277 15.8031 19.2583 16.6718 19.7603 17.37C20.2623 18.0281 21.0377 18.4446 21.88 18.49C20.87 19.97 19.11 21 17 21C14.21 21 11.8 19.12 11.8 16.8C11.8 16 12 15.3 12.5 14.6C13 13.9 13.3 13.5 14.6 12.5C15.9 11.5 17.8 10 19.4 10C20.14 10 20.8 10.23 21.4 10.65L19.4 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.5 14.6C11 15.3 10.8 16 10.8 16.8C10.8 19.12 8.39 21 5.6 21C2.5 21 0 18.5 0 15.4C0 12.3 2.5 9.80005 5.6 9.80005C6.4 9.80005 7.2 10 7.9 10.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 7C11.3726 6.37477 10.9206 5.59392 10.6931 4.73864C10.4656 3.88336 10.4707 2.98446 10.708 2.13264C10.9452 1.28082 11.4059 0.506305 12.0401 -0.111016C12.6742 -0.728337 13.4531 -1.19337 14.3054 -1.45695C15.1577 -1.72053 16.0566 -1.77089 16.9316 -1.60271C17.8066 -1.43454 18.6281 -1.05394 19.3131 -0.498329C19.9981 0.0572838 20.5236 0.780307 20.8323 1.60134C21.141 2.42237 21.223 3.31309 21.07 4.18005"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Secure Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
