"use client";

import React from 'react';
import Navbar from '../Navbar/Navbar';
import Image from 'next/image';
import collegeLogo from "../../../public/logoch.webp";

function About() {
  const developers = [
    { name: 'Aryan Tejani', rollNumber: 'Solo Levelling', branch: 'CSE' },
    // Add more developer details here
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white text-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* College Info Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 text-center border border-gray-200">
            <div className="flex flex-col items-center justify-center">
              <Image 
                src={collegeLogo} 
                alt="College Logo" 
                className="mb-4 rounded-full border-2 border-blue-200 p-1"
                width={100}
                height={100}
              />
              <h1 className="text-2xl font-bold text-blue-600">
                Charotar University of Science and Technology Anand
              </h1>
            </div>
          </div>

          {/* Developers Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-blue-600 text-center">
              Developers Detail
            </h2>
            
            <div className="space-y-4">
              {developers.map((developer, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {developer.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Team Name:</span> {developer.rollNumber}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Branch:</span> {developer.branch}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simple Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Secure File Sharing Application</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default About;