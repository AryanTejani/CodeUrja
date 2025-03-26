import React from 'react';
import './About.css';
import collegeLogo from "../../../public/logoch.webp";
import Navbar from '../Navbar/Navbar';
import Image from 'next/image';

function about() {
  const developers = [
    { name: 'Aryan Tejani', rollNumber: 'Solo Levelling',branch:'CSE' },
    // Add more developer details here
  ];

  return (
    <>
    <Navbar></Navbar>
    <div className="about-container">
      <div className="college-info">
        <Image src={collegeLogo} alt="College Logo" className="college-logo items-center justify-center" />
        <h1>Charotar University of Science and Technology Anand</h1>
      </div>
      <div className="developers-section">
        <h2>Developers Detail</h2>
        <ul className="developer-list">
          {developers.map((developer, index) => (
            <li key={index} className="developer">
              <h3>{developer.name}</h3>
              <p>Team Name : {developer.rollNumber}</p>
              <p>Branch     : {developer.branch}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
    
  );
}

export default about;
