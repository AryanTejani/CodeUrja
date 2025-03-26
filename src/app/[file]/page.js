"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import FormData from "form-data";
import Navbar from "../Navbar/Navbar";
import "./File.css";
import fileDownload from "js-file-download";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function file(props) {
  const session = useSession();
  const [grpname, setgrpname] = useState("");
  const [file, setfile] = useState(null);
  const [mail, setmail] = useState("");
  const [files, setfiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [filePassword, setFilePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Load files when component mounts
  useEffect(() => {
    if (session.status === "authenticated") {
      getfiles();
    }
  }, [session.status]);

  const resetFileInput = () => {
    setfile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function upload() {
    if (file === null) return false;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();

      reader.onload = async function () {
        try {
          const buffer = Buffer.from(reader.result);
          const bufString = buffer.toString("hex");

          console.log(`Uploading file: ${file.name} (${buffer.length} bytes)`);

          const res = await axios.post("/api/file/upload", {
            name: props.params.file,
            fileName: file.name,
            email: session.data.user.email,
            hexfile: bufString,
          });

          console.log("Upload response:", res);
          resetFileInput();
          getfiles();
        } catch (error) {
          console.error("Error during upload:", error);
          alert("Error uploading file. Please try again.");
        } finally {
          setIsLoading(false);
          setUploadProgress(0);
        }
      };

      reader.onprogress = function (event) {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      reader.onerror = function () {
        console.error("Error reading file");
        setIsLoading(false);
        setUploadProgress(0);
      };

      // Use readAsArrayBuffer for binary files
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error preparing file upload:", error);
      setIsLoading(false);
      setUploadProgress(0);
    }
  }

  const initiateDownload = (fileId) => {
    setSelectedFileId(fileId);
    setShowPasswordModal(true);
    setPasswordError("");
    setFilePassword("");
  };

  const handlePasswordSubmit = async () => {
    if (!filePassword) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const downloadFile = await axios.post("/api/file/download", {
        name: props.params.file,
        fileid: selectedFileId,
        email: session.data.user.email,
        password: filePassword,
      });

      // Reset password field and close modal
      setFilePassword("");
      setShowPasswordModal(false);

      console.log(
        "Download response received, content type:",
        downloadFile.data.headers["Content-Type"]
      );

      // All files are treated as binary/base64
      if (downloadFile.data.data.isBase64) {
        try {
          // Convert base64 to binary
          const byteCharacters = atob(downloadFile.data.data.datafile);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: downloadFile.data.headers["Content-Type"],
          });

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = downloadFile.data.headers.Name;
          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(link);
          }, 100);

          console.log("File download initiated");
        } catch (error) {
          console.error("Error processing binary file:", error);
          alert("Error processing the file. Please try again.");
        }
      } else {
        // Plain text fallback (shouldn't be used with current implementation)
        fileDownload(
          downloadFile.data.data.datafile,
          downloadFile.data.headers.Name
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      if (error.response && error.response.status === 401) {
        setPasswordError(error.response.data.error || "Incorrect password");
      } else {
        setPasswordError("Error downloading file. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getfiles = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/file/show", {
        name: props.params.file,
        email: session.data.user.email,
      });
      setfiles(res.data);
      console.log("Files retrieved:", res.data);
    } catch (error) {
      console.error("Error getting files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlefile = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log(
        "File selected:",
        selectedFile.name,
        selectedFile.type,
        selectedFile.size
      );
      setfile(selectedFile);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📑";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "🗜️";
      case "txt":
        return "📃";
      default:
        return "📁";
    }
  };

  if (session.status === "unauthenticated") {
    return (
      <div className="auth-message">
        Please authenticate to access this page
      </div>
    );
  }

  if (session.status === "authenticated") {
    return (
      <div>
        <Navbar></Navbar>
        <div className="file-container">
          <h1 className="file-heading">Group File Upload</h1>
          <p className="file-message">
            Upload and securely share files within this group.
          </p>

          <div className="file-actions">
            <div className="file-input-container">
              <label htmlFor="myfile" className="file-input-label">
                {file ? file.name : "Select File"}
              </label>
              <input
                type="file"
                id="myfile"
                ref={fileInputRef}
                onChange={handlefile}
                disabled={isLoading}
                className="file-input"
              />
              {file && (
                <span className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              )}
            </div>

            <button
              className="upload-button"
              onClick={() => upload()}
              disabled={!file || isLoading}
            >
              {isLoading ? `Uploading... ${uploadProgress}%` : "Upload"}
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="file-list-container">
            <div className="file-list-header">
              <h2 className="file-list-title">Files in this Group</h2>
              <button
                className="refresh-button"
                onClick={() => getfiles()}
                disabled={isLoading}
                title="Refresh file list"
              >
                🔄
              </button>
            </div>

            {isLoading && <div className="loading-spinner"></div>}

            {Array.isArray(files) && files.length > 0 ? (
              <ul className="file-list-items">
                {files.map((file, i) => (
                  <li key={i} className="file-item">
                    <div className="file-item-info">
                      <span className="file-icon">
                        {getFileIcon(file.name)}
                      </span>
                      <span className="file-name">{file.name}</span>
                    </div>
                    <button
                      className="download-button"
                      onClick={() => initiateDownload(file.id)}
                      disabled={isLoading}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              !isLoading && (
                <div className="empty-state">
                  <p className="no-files-message">
                    No files found in this group.
                  </p>
                  <p className="upload-prompt">Upload a file to get started.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="password-modal">
            <div className="password-modal-content">
              <h2>Enter File Password</h2>
              <p>
                This file is password protected. Please enter the password to
                download.
              </p>

              <div className="password-input-container">
                <label htmlFor="filePassword">Password:</label>
                <input
                  type="password"
                  id="filePassword"
                  value={filePassword}
                  onChange={(e) => setFilePassword(e.target.value)}
                  placeholder="Enter password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit();
                    }
                  }}
                  disabled={isLoading}
                  autoFocus
                />
                {passwordError && (
                  <p className="password-error">{passwordError}</p>
                )}
              </div>

              <div className="password-modal-buttons">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="download-submit-button"
                  onClick={handlePasswordSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
