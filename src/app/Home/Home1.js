"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import logo from '../../../public/sh1.png';
import { gsap } from 'gsap';
import Link from 'next/link';

const Home1 = () => {
  // Create refs for animation elements
  const containerRef = useRef(null);
  const headingRef = useRef(null);
  const logoRef = useRef(null);
  const subtitleRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const ctaRef = useRef(null);
  const securityNoticeRef = useRef(null);
  
  // State to control client-side rendering of elements that cause hydration issues
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side after initial render
    setIsClient(true);
    
    // Main entrance animation timeline with slower timing
    const tl = gsap.timeline({ 
      defaults: { ease: "power2.out" },
      delay: 0.5 // Give the page time to load first
    });
    
    tl.from(headingRef.current, { 
      y: -50, 
      opacity: 0, 
      duration: 1.5 
    })
    .from(logoRef.current, { 
      scale: 0.8, 
      opacity: 0, 
      duration: 1.8,
      ease: "elastic.out(1, 0.5)" 
    }, "-=0.8")
    .from(subtitleRef.current, { 
      y: 30, 
      opacity: 0, 
      duration: 1.2 
    }, "-=1")
    .from(featuresSectionRef.current.children, { 
      opacity: 0, 
      y: 30, 
      stagger: 0.3, // Slower stagger for better readability
      duration: 0.8 
    }, "-=0.6")
    .from(ctaRef.current.children, { 
      opacity: 0, 
      y: 20, 
      stagger: 0.2, 
      duration: 0.7 
    }, "-=0.3")
    .from(securityNoticeRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8
    }, "-=0.2");

    // Create a pulsing animation for the security icons
    gsap.to(".security-icon", {
      opacity: 0.3,
      duration: 3,
      repeat: -1,
      yoyo: true,
      stagger: 0.5,
      ease: "sine.inOut"
    });
    
    // Create a slow rotation for the security icons
    gsap.to(".security-icon", {
      rotate: 360,
      duration: 60, // Very slow rotation
      repeat: -1,
      ease: "none",
      stagger: {
        each: 10,
        repeat: -1
      }
    });
    
    // Create a pulsing glow effect for the feature cards
    const pulseTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 2
    });
    
    pulseTimeline
      .to(".feature-card-blue", { 
        boxShadow: "0 0 15px 2px rgba(59, 130, 246, 0.3)", 
        duration: 2,
        ease: "sine.inOut"
      })
      .to(".feature-card-blue", { 
        boxShadow: "0 0 5px 0px rgba(59, 130, 246, 0.1)", 
        duration: 2,
        ease: "sine.inOut"
      })
      .to(".feature-card-green", { 
        boxShadow: "0 0 15px 2px rgba(16, 185, 129, 0.3)", 
        duration: 2,
        ease: "sine.inOut"
      }, "-=3")
      .to(".feature-card-green", { 
        boxShadow: "0 0 5px 0px rgba(16, 185, 129, 0.1)", 
        duration: 2,
        ease: "sine.inOut"
      }, "-=1")
      .to(".feature-card-purple", { 
        boxShadow: "0 0 15px 2px rgba(139, 92, 246, 0.3)", 
        duration: 2,
        ease: "sine.inOut"
      }, "-=3")
      .to(".feature-card-purple", { 
        boxShadow: "0 0 5px 0px rgba(139, 92, 246, 0.1)", 
        duration: 2,
        ease: "sine.inOut"
      }, "-=1");
      
    // Create a subtle "encryption" animation for the security notice
    const encryptionTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 5
    });
    
    encryptionTimeline
      .to(".encryption-indicator", {
        backgroundColor: "rgba(234, 179, 8, 0.4)",
        duration: 0.8,
        stagger: 0.05,
        ease: "steps(1)"
      })
      .to(".encryption-indicator", {
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        duration: 0.8,
        stagger: 0.05,
        ease: "steps(1)"
      });
    
    // Clean up animations on component unmount
    return () => {
      tl.kill();
      pulseTimeline.kill();
      encryptionTimeline.kill();
      gsap.killTweensOf(".security-icon");
    };
  }, []);

  // Generate binary pattern only on client-side to avoid hydration errors
  const generateBinaryPattern = () => {
    if (!isClient) return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none select-none text-xs leading-3 tracking-tighter text-green-500 font-mono">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap">
            {Array.from({ length: 100 }).map((_, j) => (
              <span key={j}>{Math.round(Math.random())}</span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
      {/* Animated security background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="security-icon absolute top-[10%] left-[5%] text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
          </svg>
        </div>
        <div className="security-icon absolute top-[30%] right-[15%] text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z"/>
          </svg>
        </div>
        <div className="security-icon absolute bottom-[20%] left-[20%] text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
          </svg>
        </div>
        <div className="security-icon absolute top-[60%] right-[10%] text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11 9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4 4 0 0 1 0 8zm4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5z"/>
            <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
        </div>
        <div className="security-icon absolute top-[40%] left-[50%] text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.25-11.25A1.25 1.25 0 1 1 9.5 6 1.25 1.25 0 0 1 8.25 4.75zm0 8.5a.75.75 0 0 1-1.5 0V9.5h1.5v3.75z"/>
          </svg>
        </div>
        <div className="security-icon absolute bottom-[40%] right-[30%] text-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
          </svg>
        </div>
      </div>
      
      {/* Binary code effect in background - Render only on client side */}
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
      
      {/* Main content */}
      <div ref={containerRef} className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen relative z-10">
        <div className="text-center">
          <h1 ref={headingRef} className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Welcome to 
          </h1>
          
          <div ref={logoRef} className="my-6 transform hover:scale-105 transition-transform duration-300 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
            <Image 
              src={logo} 
              alt="SecureShare Logo" 
              className="mx-auto relative z-10" 
              width={300}
              height={100}
              priority
            />
          </div>
          
          <h2 ref={subtitleRef} className="text-xl md:text-2xl font-semibold mb-8 text-gray-300">
            Your Secure Alternative to Google Drive with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 ml-2">
              End-to-End Encryption
            </span>
          </h2>
          
          <div ref={featuresSectionRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 max-w-5xl mx-auto">
            <div className="feature-card-blue bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-blue-900/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-blue-600/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-blue-300 relative z-10">End-to-End AES-256 Encryption</h3>
              <p className="text-gray-300 relative z-10">Your files are encrypted before they leave your device using military-grade AES-256 encryption, ensuring only you and your intended recipients can access them.</p>
            </div>
            
            <div className="feature-card-green bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-green-900/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-green-600/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-green-300 relative z-10">Password-Protected Sharing</h3>
              <p className="text-gray-300 relative z-10">Share files with password protection and expiration dates, ensuring only authorized users with the correct credentials can access your sensitive data.</p>
            </div>
            
            <div className="feature-card-purple bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-purple-900/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-purple-600/20 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-300 relative z-10">Zero-Knowledge Storage</h3>
              <p className="text-gray-300 relative z-10">Unlike Google Drive, your files are stored in encrypted format that even we can't read. Your data remains private, even if our servers were compromised.</p>
            </div>
          </div>
          
          <div className="my-10 max-w-3xl mx-auto">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <h3 className="text-yellow-400 text-lg font-medium">The Google Drive Problem</h3>
                <p className="text-gray-300 mt-1">Google Drive and similar platforms store your unencrypted data on their servers, making it vulnerable to breaches and accessible to service providers. Our solution fixes this fundamental security flaw.</p>
              </div>
            </div>
          </div>
          
          <div ref={ctaRef} className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <Link href="/login">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-medium text-white shadow-lg hover:shadow-blue-600/30 transition-all duration-300 hover:-translate-y-1 border border-blue-500/30 flex items-center group">
                <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Secure Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg font-medium text-white shadow-lg hover:shadow-green-600/30 transition-all duration-300 hover:-translate-y-1 border border-green-500/30 flex items-center group">
                <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Secure Account
              </button>
            </Link>
            <Link href="/about">
              <button className="px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg font-medium text-white shadow-lg hover:shadow-gray-600/30 transition-all duration-300 hover:-translate-y-1 border border-gray-600/30 flex items-center group">
                <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </button>
            </Link>
          </div>
          
          <div ref={securityNoticeRef} className="mt-16 max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-sm p-5 rounded-xl border border-gray-700 relative overflow-hidden">
            {/* Encryption animation indicators - only render on client side */}
            {isClient && (
              <div className="absolute top-0 left-0 w-full h-1 flex">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="encryption-indicator h-full flex-1 bg-yellow-500/10"></div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-gray-300">
                Your data never leaves your device in an unencrypted form. We cannot access your files, even if requested by authorities.
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
    </div>
  );
};

export default Home1;
