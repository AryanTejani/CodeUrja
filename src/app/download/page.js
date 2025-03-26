"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function download() {
  const session = useSession();
  const [grpname, setgrpname] = useState("");
  const [files, setfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filePassword, setFilePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [passwordError, setPasswordError] = useState(""); // Added missing state

  useEffect(() => {
    if (session.status === "authenticated" && grpname) {
      getfiles();
    }
  }, [session.status, grpname]);

  const handlechange = (e) => {
    setgrpname(e.target.value);
  };

  const initiateDownload = (fileId) => {
    setSelectedFileId(fileId);
    setShowPasswordModal(true);
    setFilePassword("");
    setErrorStatus(false);
    setErrorMessage("");
    setPasswordError(""); // Clear any previous password errors
  };

  const handlePasswordSubmit = async () => {
    if (!filePassword) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    setPasswordError(""); // Clear any previous errors

    try {
      console.log("Requesting file download with password...");
      const response = await axios.post("/api/file/download", {
        name: grpname, // Fixed: was using props.params.file which doesn't exist
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
        "Base64 encoded",
        "Size:",
        downloadData.data.fileSize
      );

      console.log(
        "Response structure:",
        JSON.stringify({
          hasData: !!downloadData.data,
          dataProps: downloadData.data ? Object.keys(downloadData.data) : [],
          hasHeaders: !!downloadData.headers,
          headerProps: downloadData.headers
            ? Object.keys(downloadData.headers)
            : [],
          contentType: downloadData.headers?.["Content-Type"],
          fileName: downloadData.headers?.Name,
          dataFileLength: downloadData.data?.datafile?.length,
        })
      );

      // Ensure base64 string is properly padded
      let base64Data = downloadData.data.datafile;
      while (base64Data.length % 4 !== 0) {
        base64Data += "=";
      }

      try {
        // Simplified approach for all file types
        console.log("Processing file download...");

        // Convert base64 to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        // First few bytes for debugging
        const firstBytes = Array.from(byteArray.slice(0, 10))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        console.log("First bytes of file (hex):", firstBytes);

        // Check PDF signature if it's a PDF
        if (downloadData.headers["Content-Type"] === "application/pdf") {
          const isPDF = firstBytes.startsWith("255044462d"); // %PDF- in hex
          console.log("Is PDF signature present:", isPDF);
        }

        // Create blob with proper MIME type
        const blob = new Blob([byteArray], {
          type:
            downloadData.headers["Content-Type"] || "application/octet-stream",
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = downloadData.headers.Name || "downloaded-file";
        document.body.appendChild(link);

        console.log("Download link created, initiating download...");
        link.click();

        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
          console.log("Download complete and resources cleaned up");
        }, 500); // Increased timeout for reliability
      } catch (error) {
        console.error("Error processing file data:", error);
        alert(`Error processing the file: ${error.message}`);
      }
    } catch (error) {
      console.error("Download error:", error);

      // Show detailed error information for debugging
      let errorMsg = "Error downloading file. Please try again.";

      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response status:", error.response.status);

        if (error.response.status === 401) {
          errorMsg = error.response.data.error || "Incorrect password";
        } else if (error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      setPasswordError(errorMsg);
      setShowPasswordModal(true); // Keep modal open on error
    } finally {
      setIsLoading(false);
    }
  };

  const getfiles = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/file/show", {
        name: grpname,
        email: session.data.user.email,
      });
      setfiles(res.data);
      console.log("Files retrieved:", res.data);
      setErrorStatus(false);
    } catch (error) {
      console.error("Error getting files:", error);
      setErrorStatus(true);
      setErrorMessage("Error retrieving files. Please try again.");
      setfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative download function for debugging
  const debugDownload = async (fileId) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        "/api/file/download",
        {
          name: grpname,
          fileid: fileId,
          email: session.data.user.email,
          password: filePassword,
        },
        {
          responseType: "blob", // Request direct blob response
        }
      );

      // Create download from blob
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers["content-disposition"];
      let filename = "downloaded-file";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 500);
    } catch (error) {
      console.error("Debug download error:", error);
      alert("Error during debug download: " + error.message);
    } finally {
      setIsLoading(false);
      setShowPasswordModal(false);
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
      <div className="download-container">
        <h1>File Download</h1>

        <div className="group-input">
          <label htmlFor="grpname">Enter Group Name</label>
          <input
            type="text"
            id="grpname"
            value={grpname}
            onChange={handlechange}
            placeholder="Enter group name"
          />
          <button
            type="submit"
            onClick={() => getfiles()}
            disabled={isLoading || !grpname}
          >
            {isLoading ? "Loading..." : "Get Files"}
          </button>
        </div>

        {errorStatus && <div className="error-message">{errorMessage}</div>}

        <div className="files-list">
          {isLoading ? (
            <div className="loading">Loading files...</div>
          ) : Array.isArray(files) && files.length > 0 ? (
            files.map((file, index) => (
              <div key={index} className="file-item">
                <h3>{file.name}</h3>
                <button
                  type="button"
                  onClick={() => initiateDownload(file.id)}
                  disabled={isLoading}
                >
                  Download
                </button>
              </div>
            ))
          ) : (
            <div className="no-files">
              {grpname
                ? "No files found in this group"
                : "Enter a group name to view files"}
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

              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}

              <div className="password-input">
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
              </div>

              <div className="modal-buttons">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button onClick={handlePasswordSubmit} disabled={isLoading}>
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
