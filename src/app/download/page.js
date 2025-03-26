"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import fileDownload from "js-file-download";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function download() {
  const session = useSession();
  const [grpname, setgrpname] = useState("");
  const [files, setfiles] = useState([]);

  console.log("Download Page.js ", session);

  const handlechange = (e) => {
    setgrpname(e.target.value);
  };

  const download = async (e) => {
    try {
      const downloadFile = await axios.get("/api/file/download", {
        responseType: "blob",
        params: {
          fileid: e,
          groupname: grpname,
        },
      });
      fileDownload(downloadFile.data, downloadFile.headers.name);
    } catch (error) {
      console.log(error);
      setErrorStatus(true);
      setErrorMessage("Error downloading files.");
    }
  };

  const getfiles = async () => {
    try {
      console.log("/api/getfiles/");
      const res = await axios.post("/api/getfiles/" + grpname);
      setfiles(res.data);
      console.log("!files ", res);
    } catch (error) {
      console.log("cant get files ", err);
    }
  };

  console.log(grpname);
  console.log("files ", files);

  if (session.status === "unauthenticated") {
    return <div>pls authenticate</div>;
  }
  if (session.status === "authenticated") {
    console.log(session.data.user.email);
    // setmail(session.data.user.email);
    return (
      <div>
        <label for="grpname">Enter Group Name</label>
        <input type="text" id="grpname" onChange={handlechange} />
        <button type="submit" onClick={() => getfiles()}>
          Get Files
        </button>
        <div>
          {Array.isArray(files) &&
            files.map((file) => (
              // return(
              <div>
                <h1>{file.name}</h1>
                <button type="submit" onClick={() => download(file.id)}>
                  Download
                </button>
              </div>
              // );
            ))}
        </div>
      </div>
    );
  }
}
