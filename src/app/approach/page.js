import React from 'react';
import './Approach.css';
import Navbar from '../Navbar/Navbar';


function approach() {
  const approachSteps = [
    {
      title: 'User account created',
      description: 'User account is created, and public and private keys are generated and stored securely.',
    },
    {
      title: 'Group created',
      description: 'Groups are created with their own public and private keys, and user permissions are managed.',
    },
    {
      title: 'User added to group',
      description: 'Users are added to groups, and access to group content is managed securely.',
    },
    {
      title: 'User removed from group',
      description: 'Users can be removed from groups with their access revoked securely.',
    },
    {
      title: 'File Uploaded',
      description: 'Files are encrypted with group keys and uploaded securely to group folders.',
    },
    {
      title: 'File Download',
      description: 'Files are decrypted securely and made available for download.',
    },
  ];

  return (
    <>
    <Navbar/>
    <div className="approach-container">
      <h1 className="page-title">Our Project Approach</h1>
      <div className="approach-steps">
        {approachSteps.map((step, index) => (
          <div className="step" key={index}>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </div>
    </>
    
  );
}

export default approach;
