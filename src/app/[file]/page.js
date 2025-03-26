"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import FormData from "form-data";
import Navbar from "../Navbar/Navbar";
import "./File.css";
import fileDownload from "js-file-download";
import dynamic from "next/dynamic";

// Dynamically import the AI component with no SSR to avoid hydration issues
const AiChat = dynamic(() => import("../ai/page"), {
  ssr: false,
  loading: () => <div className="ai-loading">Loading AI assistant...</div>,
});

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
  const [showAiChat, setShowAiChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const initiateDownload = (fileId, fileName) => {
    setSelectedFileId(fileId);
    setShowPasswordModal(true);
    setPasswordError("");
    setFilePassword("");
    // Store the selected file info for AI
    setSelectedFile(fileName);
  };

  const handlePasswordSubmit = async () => {
    if (!filePassword) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Requesting file download with password...");
      const response = await axios.post("/api/file/download", {
        name: props.params.file,
        fileid: selectedFileId,
        email: session.data.user.email,
        password: filePassword,
      });

      // Reset password field and close modal
      setFilePassword("");
      setShowPasswordModal(false);

      console.log("Download response received:", response.status);

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response format");
      }

      const downloadData = response.data;
      console.log(
        "File info:",
        downloadData.headers.Name,
        downloadData.headers["Content-Type"],
        downloadData.data.isBase64 ? "Base64 encoded" : "Raw data",
        "Size:",
        downloadData.data.fileSize || "unknown"
      );

      // Debug response structure
      console.log(
        "Response structure:",
        JSON.stringify({
          hasData: !!downloadData,
          dataProps: downloadData ? Object.keys(downloadData) : [],
          hasHeaders: !!downloadData.headers,
          headerProps: downloadData.headers
            ? Object.keys(downloadData.headers)
            : [],
          contentType: downloadData.headers
            ? downloadData.headers["Content-Type"]
            : null,
          fileName: downloadData.headers ? downloadData.headers.Name : null,
          dataFileLength:
            downloadData.data && downloadData.data.datafile
              ? downloadData.data.datafile.length
              : 0,
        })
      );

      // All files are treated as binary/base64
      if (downloadData.data.isBase64) {
        try {
          // Create a blob from the base64 data
          const binaryString = atob(downloadData.data.datafile);
          const bytes = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create blob with the correct MIME type
          const blob = new Blob([bytes], {
            type:
              downloadData.headers["Content-Type"] ||
              "application/octet-stream",
          });

          // Create and trigger download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = downloadData.headers.Name || "downloaded-file";
          document.body.appendChild(link);

          console.log("Download link created, initiating download...");

          // Add a small delay before clicking to ensure the link is ready
          setTimeout(() => {
            link.click();

            // Clean up
            setTimeout(() => {
              URL.revokeObjectURL(url);
              document.body.removeChild(link);
              console.log("Download complete and resources cleaned up");
            }, 100);
          }, 100);

          // Show AI chat after successful download
          setShowAiChat(true);
        } catch (error) {
          console.error("Error processing binary file:", error);
          alert(`Error processing the file: ${error.message}`);
        }
      } else {
        // Fallback for non-base64 data (shouldn't happen with current implementation)
        console.log("Using fallback download method");
        fileDownload(
          downloadData.data.datafile,
          downloadData.headers.Name || "downloaded-file"
        );

        // Show AI chat after successful download
        setShowAiChat(true);
      }
    } catch (error) {
      console.error("Download error:", error);

      // Show detailed error information for debugging
      let errorMessage = "Error downloading file. Please try again.";

      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response status:", error.response.status);

        if (error.response.status === 401) {
          errorMessage = error.response.data.error || "Incorrect password";
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPasswordError(errorMessage);
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
        <div className="main-container">
          <div className={`file-container ${showAiChat ? "with-ai" : ""}`}>
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
                <div className="file-list-actions">
                  <button
                    className="ai-toggle-button"
                    onClick={() => setShowAiChat(!showAiChat)}
                    title={
                      showAiChat ? "Hide AI Assistant" : "Show AI Assistant"
                    }
                  >
                    {showAiChat ? "Hide AI" : "Show AI"}
                  </button>
                  <button
                    className="refresh-button"
                    onClick={() => getfiles()}
                    disabled={isLoading}
                    title="Refresh file list"
                  >
                    🔄
                  </button>
                </div>
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
                      <div className="file-item-actions">
                        <button
                          className="ai-analyze-button"
                          onClick={() => {
                            setSelectedFile(file.name);
                            setShowAiChat(true);
                          }}
                          title="Analyze with AI"
                        >
                          AI
                        </button>
                        <button
                          className="download-button"
                          onClick={() => initiateDownload(file.id, file.name)}
                          disabled={isLoading}
                        >
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !isLoading && (
                  <div className="empty-state">
                    <p className="no-files-message">
                      No files found in this group.
                    </p>
                    <p className="upload-prompt">
                      Upload a file to get started.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* AI Chat Component */}
          {showAiChat && (
            <div className="ai-chat-container">
              <div className="ai-chat-header">
                <h2>AI Assistant</h2>
                <button
                  className="close-ai-button"
                  onClick={() => setShowAiChat(false)}
                >
                  ✕
                </button>
              </div>
              <div className="ai-chat-content">
                <AiChat
                  currentFile={selectedFile}
                  groupName={props.params.file}
                />
              </div>
            </div>
          )}
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
