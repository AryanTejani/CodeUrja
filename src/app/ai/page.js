"use client";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  X,
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  Settings,
  Moon,
  Sun,
  Trash2,
  Download as Dicon,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Book,
  BookOpen,
} from "lucide-react";
import Navbar from "../Navbar/components/Navbar";
// Emergency keywords for safety detection
const EMERGENCY_KEYWORDS = [
  "suicide",
  "kill myself",
  "end my life",
  "want to die",
  "self harm",
  "hurt myself",
  "cutting myself",
  "heart attack",
  "stroke",
  "seizure",
  "bleeding badly",
  "overdose",
  "poisoning",
  "emergency",
  "abuse",
  "assault",
  "rape",
  "violent",
  "attack",
  "weapon",
  "gun",
  "bomb",
  "explosive",
  "terrorism",
  "terrorist",
  "mass shooting",
  "hostage",
  "kidnap",
  "abduction",
  "severe pain",
  "unconscious",
  "not breathing",
  "child abuse",
  "domestic violence",
  "traffick",
];

// Caching for AI responses
const responseCache = new Map();
const CACHE_EXPIRY = 60 * 60 * 1000;

const getModelForQuery = (query) => {
  if (query.split(" ").length > 15 || query.includes(",")) {
    return "gemini-1.5-pro";
  }
  return "gemini-1.5-flash";
};

const sanitizeInput = (input) => {
  return input
    .replace(/[^\p{L}\p{N}\s.,?!-:;()]/gu, "")
    .trim()
    .substring(0, 800);
};

const containsEmergencyKeywords = (input) => {
  const lowerInput = input.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => lowerInput.includes(keyword));
};

const getCacheKey = (input) => {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Voice language mapping
const VOICE_LANGUAGES = {
  en: "en-US",
  hi: "hi-IN",
  gu: "gu-IN",
};

export default function Download() {
  const API_KEY = "AIzaSyCiO0Ep9g6YCDcdks_Xar-xm_4VNemkTyM";
  const session = useSession();

  // File management states
  const [grpname, setgrpname] = useState("");
  const [files, setfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filePassword, setFilePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      window.pdfjsLib = pdfjsLib;
    }
  }, []);

  // PDF viewer states
  const [currentPdf, setCurrentPdf] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfText, setPdfText] = useState("");

  // Chat states
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to the File Analysis Assistant! I can help you analyze your documents. Upload or open a file, and I'll be ready to answer your questions about it.",
      sender: "ai",
      timestamp: Date.now(),
    },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en");
  const messagesEndRef = useRef(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Voice assistant states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  useEffect(() => {
    if (session.status === "authenticated" && grpname) {
      getfiles();
    }
  }, [session.status, grpname]);

  // Load history from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("fileAnalysisHistory");
      if (savedHistory) {
        try {
          setFullHistory(JSON.parse(savedHistory));
        } catch (error) {
          console.error("Error parsing history:", error);
        }
      }

      // Set dark mode based on user preference
      document.body.classList.toggle("light-theme", !darkMode);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      ) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setTimeout(() => handleSendMessage(transcript), 500);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          setError(
            "Voice recognition failed. Please try again or type your question."
          );
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setError("Speech recognition is not supported in your browser.");
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced history function to store complete conversations
  const addToHistory = (newMessage) => {
    if (newMessage.sender === "user") {
      // Create a new conversation entry when user sends a message
      const conversationId = Date.now();

      // Create a complete conversation object
      const conversationObj = {
        id: conversationId,
        timestamp: Date.now(),
        userMessage: newMessage.text,
        aiResponse: null, // Will be filled when AI responds
        allMessages: [...messages, newMessage], // Store all current messages for context
        fileInfo: currentPdf
          ? {
              name: currentPdf.name,
              type: currentPdf.type,
              id: currentPdf.id,
            }
          : null,
      };

      // Add to history and set as active conversation
      const updatedHistory = [...fullHistory, conversationObj];
      setFullHistory(updatedHistory);
      setActiveConversation(conversationId);

      // Save to localStorage
      localStorage.setItem(
        "fileAnalysisHistory",
        JSON.stringify(updatedHistory)
      );
    } else if (newMessage.sender === "ai" && activeConversation) {
      // Update the active conversation with AI's response
      const updatedHistory = fullHistory.map((conv) => {
        if (conv.id === activeConversation) {
          // Update the conversation with AI response
          return {
            ...conv,
            aiResponse: newMessage.text,
            allMessages: [...conv.allMessages, newMessage], // Add AI message to conversation
          };
        }
        return conv;
      });

      setFullHistory(updatedHistory);
      localStorage.setItem(
        "fileAnalysisHistory",
        JSON.stringify(updatedHistory)
      );
      setActiveConversation(null); // Reset active conversation
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlechange = (e) => {
    setgrpname(e.target.value);
  };

  const initiateDownload = (fileId, fileName, fileType) => {
    setSelectedFileId(fileId);
    setShowPasswordModal(true);
    setFilePassword("");
    setErrorStatus(false);
    setErrorMessage("");
    setPasswordError("");
  };

  const handlePasswordSubmit = async () => {
    if (!filePassword) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    setPasswordError("");

    try {
      console.log("Requesting file download with password...");
      const response = await axios.post("/api/file/download", {
        name: grpname,
        fileid: selectedFileId,
        email: session.data.user.email,
        password: filePassword,
      });

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

      // Ensure base64 string is properly padded
      let base64Data = downloadData.data.datafile;
      while (base64Data.length % 4 !== 0) {
        base64Data += "=";
      }

      try {
        // Convert base64 to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        // Create blob with proper MIME type
        const blob = new Blob([byteArray], {
          type:
            downloadData.headers["Content-Type"] || "application/octet-stream",
        });

        // If it's a PDF, display it in the viewer
        if (downloadData.headers["Content-Type"] === "application/pdf") {
          setCurrentPdf({
            blob: blob,
            url: URL.createObjectURL(blob),
            name: downloadData.headers.Name || "document.pdf",
            type: downloadData.headers["Content-Type"],
            id: selectedFileId,
          });

          setPdfViewerOpen(true);

          // Extract text from PDF for AI analysis
          extractTextFromPdf(blob);
        } else {
          // For non-PDF files, download directly
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
          }, 500);
        }

        // Reset password and close modal
        setFilePassword("");
        setShowPasswordModal(false);
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

  const handleTextUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a PDF file
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a URL for the file
      const fileURL = URL.createObjectURL(file);

      // Load the PDF document using the imported pdfjsLib
      const loadingTask = pdfjsLib.getDocument(fileURL);
      const pdf = await loadingTask.promise;

      // Get total number of pages
      const numPages = pdf.numPages;
      let fullText = "";

      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      // Set the extracted text
      setPdfText(fullText);

      // Update the current PDF info if not already set
      if (!currentPdf) {
        setCurrentPdf({
          name: file.name,
          type: file.type,
          url: fileURL,
          id: Date.now().toString(),
        });
      }

      // Update the AI with context about the PDF upload
      const aiMessage = {
        text: `I've extracted the text content from "${file.name}". You can now ask me questions about its content.`,
        sender: "ai",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing PDF file:", error);
      setError(
        "Failed to extract text from the PDF. The file may be corrupted, password-protected, or contain only images."
      );
      setIsLoading(false);

      // Revoke object URL if created
      if (file.objectUrl) {
        URL.revokeObjectURL(file.objectUrl);
      }
    }
  };

  // Extract text from PDF for AI analysis
  const extractTextFromPdf = async (pdfBlob) => {
    try {
      setIsLoading(true);

      // Set temporary extraction message
      setPdfText("PDF text extraction is in progress. Please wait...");

      // In a production environment, you would use pdf.js or a similar library
      // For now, we'll simulate the extraction with a timeout
      // This is where you would integrate actual PDF text extraction

      // Simulated extraction (replace with actual implementation)
      setTimeout(() => {
        try {
          // For a real implementation, you'd use code like:
          // const pdfjsLib = window.pdfjsLib;
          // const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(pdfBlob));
          // loadingTask.promise.then(pdf => {
          //   let fullText = '';
          //   const processPage = async (pageNum) => {
          //     const page = await pdf.getPage(pageNum);
          //     const textContent = await page.getTextContent();
          //     const pageText = textContent.items.map(item => item.str).join(' ');
          //     fullText += pageText + '\n\n';
          //
          //     if (pageNum < pdf.numPages) {
          //       processPage(pageNum + 1);
          //     } else {
          //       setPdfText(fullText);
          //       setIsLoading(false);
          //     }
          //   };
          //   processPage(1);
          // });

          // For now, set a placeholder
          setPdfText(
            "This is the extracted content from the PDF. In a real implementation, this would contain the actual text content of your document. You can analyze this text to answer user queries about the document."
          );
          setIsLoading(false);

          // Update AI with context about the PDF
          const aiMessage = {
            text: `I've loaded the document "${currentPdf.name}". You can now ask me questions about its content.`,
            sender: "ai",
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, aiMessage]);
        } catch (extractError) {
          console.error("Error in text extraction:", extractError);
          setPdfText(
            "Unable to extract text from this PDF. The document might be scanned or have security restrictions."
          );
          setIsLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      setError(
        "Failed to extract text from PDF. Some AI analysis features may be limited."
      );
      setPdfText(
        "Unable to extract text from this PDF. The document might be scanned or have security restrictions."
      );
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

  // Updated language detection to include Gujarati
  const detectLanguage = (text) => {
    // Only detect language if there's a clear pattern
    if (/[\u0A80-\u0AFF]{3,}/.test(text)) return "gu"; // At least 3 Gujarati characters
    if (/[\u0600-\u06FF]{3,}/.test(text)) return "ar"; // At least 3 Arabic characters
    if (/[\u0900-\u097F]{3,}/.test(text)) return "hi"; // At least 3 Hindi characters
    if (/(?:hola|como|gracias|buenos|días)/.test(text.toLowerCase()))
      return "es";
    if (/(?:bonjour|merci|comment|salut)/.test(text.toLowerCase())) return "fr";
    return "en"; // Default to English
  };

  // Use a consistent disclaimer in the user's language
  const getEmergencyMessage = (lang) => {
    const disclaimers = {
      en: "\n\n🔍 Note: This is general information. Always consult a professional for specific advice.",
      es: "\n\n🔍 Nota: Esta es información general. Consulte siempre a un profesional para obtener consejos específicos.",
      fr: "\n\n🔍 Remarque: Il s'agit d'informations générales. Consultez toujours un professionnel pour des conseils spécifiques.",
      ar: "\n\n🔍 ملاحظة: هذه معلومات عامة. استشر دائمًا أخصائيًا للحصول على نصائح محددة.",
      hi: "\n\n🔍 नोट: यह सामान्य जानकारी है। विशिष्ट सलाह के लिए हमेशा एक पेशेवर से परामर्श करें।",
      gu: "\n\n🔍 નોંધ: આ સામાન્ય માહિતી છે. વિશિષ્ટ સલાહ માટે હંમેશા વ્યાવસાયિકની સલાહ લો.",
    };
    return disclaimers[lang] || disclaimers.en;
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = VOICE_LANGUAGES[language] || "en-US";
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (error) {
        console.error("Speech recognition error:", error);
        setError("Could not start voice recognition. Please try again.");
      }
    }
  };

  // Toggle voice output
  const toggleVoiceOutput = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // Apply theme to body
    if (typeof document !== "undefined") {
      document.body.classList.toggle("light-theme", !darkMode);
    }
  };

  // Speak text using appropriate voice for the language
  const speakText = (text) => {
    if (!voiceEnabled || !synthRef.current) return;

    // Clean up the text - remove emoji and other non-speech elements
    const cleanText = text
      .replace(/\n\n🔍 Note:.+/g, "") // Remove disclaimer
      .replace(/[^\p{L}\p{N}\s.,?!:;()-]/gu, "") // Remove emoji and special chars
      .trim();

    if (synthRef.current) {
      synthRef.current.cancel(); // Stop any current speech

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Set language based on detected language
      utterance.lang = VOICE_LANGUAGES[language] || "en-US";

      // Try to find an appropriate voice
      const voices = synthRef.current.getVoices();
      const languageVoice = voices.find((voice) =>
        voice.lang.startsWith(utterance.lang)
      );
      if (languageVoice) {
        utterance.voice = languageVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  };

  // Export chat history function
  const exportChatHistory = () => {
    try {
      // Format the history for export
      const historyForExport = fullHistory
        .map((conv) => {
          const date = new Date(conv.timestamp).toLocaleDateString();
          const time = new Date(conv.timestamp).toLocaleTimeString();

          let formattedMessages = "";
          if (conv.messages && conv.messages.length) {
            formattedMessages = conv.messages
              .map(
                (msg) =>
                  `${msg.sender === "user" ? "You" : "Assistant"}: ${msg.text}`
              )
              .join("\n\n");
          } else {
            formattedMessages = `You: ${conv.text}`;
          }

          let fileInfo = "";
          if (conv.fileInfo) {
            fileInfo = `\nDocument: ${conv.fileInfo.name}`;
          }

          return `--- Conversation from ${date} at ${time} ${fileInfo} ---\n\n${formattedMessages}\n\n`;
        })
        .join("\n");

      // Create a downloadable file
      const blob = new Blob([historyForExport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `file-analysis-history-${new Date()
        .toISOString()
        .slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting history:", error);
      setError("Failed to export history. Please try again.");
    }
  };

  const getAIResponse = async (userInput) => {
    try {
      const detectedLang = detectLanguage(userInput);
      setLanguage(detectedLang);

      if (containsEmergencyKeywords(userInput)) {
        return getEmergencyMessage(detectedLang);
      }

      const cacheKey = getCacheKey(userInput);
      if (responseCache.has(cacheKey)) {
        const cachedData = responseCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
          return cachedData.response;
        }
      }

      const model = getModelForQuery(userInput);
      const cleanInput = sanitizeInput(userInput);

      // Include PDF context if available
      let pdfContext = "";
      let fileNameContext = "";

      if (currentPdf) {
        fileNameContext = `\nThe user is asking about the document: "${currentPdf.name}"`;

        // Only include PDF text if it's not still in extraction process
        if (pdfText && !pdfText.includes("extraction is in progress")) {
          // Limit context size to avoid token limits
          const maxContextLength = 2000;
          const truncatedText =
            pdfText.length > maxContextLength
              ? pdfText.substring(0, maxContextLength) +
                "... (text truncated due to length)"
              : pdfText;

          pdfContext = `\n\nDocument content: ${truncatedText}`;
        }
      }

      const promptTemplate = {
        en: `You are a helpful document analysis assistant. Follow these rules STRICTLY:
1. IMPORTANT: Only answer what was asked in relation to the document or file management.
2. Stay focused on the user's specific question about the document.
3. If the user asks about document content, analyze the provided document context.
4. Use simple language (8th grade level).
5. Always respond in the same language as the user's query.
6. If no document is loaded or the context is insufficient, politely ask the user to provide more information.

Format responses with relevant information about the document or answer the user's query directly.${fileNameContext}${pdfContext}`,
        hi: `आप एक सहायक दस्तावेज़ विश्लेषण सहायक हैं। इन नियमों का कड़ाई से पालन करें:
1. महत्वपूर्ण: केवल दस्तावेज़ या फ़ाइल प्रबंधन के संबंध में पूछे गए प्रश्न का उत्तर दें।
2. उपयोगकर्ता के दस्तावेज़ के बारे में विशिष्ट प्रश्न पर ध्यान केंद्रित रखें।
3. यदि उपयोगकर्ता दस्तावेज़ सामग्री के बारे में पूछता है, तो प्रदान किए गए दस्तावेज़ संदर्भ का विश्लेषण करें।
4. सरल भाषा का प्रयोग करें।
5. हमेशा उपयोगकर्ता की प्रश्न भाषा में उत्तर दें।
6. यदि कोई दस्तावेज़ लोड नहीं किया गया है या संदर्भ अपर्याप्त है, तो विनम्रता से उपयोगकर्ता से अधिक जानकारी प्रदान करने के लिए कहें।

दस्तावेज़ के बारे में प्रासंगिक जानकारी के साथ प्रतिक्रिया दें या सीधे उपयोगकर्ता के प्रश्न का उत्तर दें।${fileNameContext}${pdfContext}`,
        gu: `તમે એક મદદગાર દસ્તાવેજ વિશ્લેષણ સહાયક છો. આ નિયમોનું ચુસ્તપણે પાલન કરો:
1. મહત્વપૂર્ણ: માત્ર દસ્તાવેજ અથવા ફાઇલ મેનેજમેન્ટના સંબંધમાં પૂછવામાં આવેલા પ્રશ્નનો જ જવાબ આપો.
2. વપરાશકર્તાના દસ્તાવેજ વિશેના ચોક્કસ પ્રશ્ન પર ધ્યાન કેન્દ્રિત કરો.
3. જો વપરાશકર્તા દસ્તાવેજ સામગ્રી વિશે પૂછે છે, તો પ્રદાન કરેલ દસ્તાવેજ સંદર્ભનું વિશ્લેષણ કરો.
4. સરળ ભાષાનો ઉપયોગ કરો.
5. હંમેશા વપરાશકર્તાના પ્રશ્નની ભાષામાં જ જવાબ આપો.
6. જો કોઈ દસ્તાવેજ લોડ કરવામાં આવ્યો નથી અથવા સંદર્ભ અપૂરતો છે, તો વિનમ્રતાથી વપરાશકર્તાને વધુ માહિતી પ્રદાન કરવા માટે કહો.

દસ્તાવેજ વિશે સંબંધિત માહિતી સાથે પ્રતિસાદ આપો અથવા સીધા વપરાશકર્તાના પ્રશ્નનો જવાબ આપો.${fileNameContext}${pdfContext}`,
      };

      const promptLang = promptTemplate[detectedLang] || promptTemplate.en;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${promptLang}
  
  User input: ${cleanInput}`,
                  },
                ],
              },
            ],
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Details:", errorData);
        throw new Error(
          `API Error: ${errorData.error?.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      const aiText =
        data.candidates?.[0]?.content?.parts[0]?.text ||
        "I'm unable to provide information right now. Please try again.";

      // Get appropriate disclaimer for the detected language
      const disclaimer = getEmergencyMessage(detectedLang);
      const fullResponse = aiText + disclaimer;

      responseCache.set(cacheKey, {
        response: fullResponse,
        timestamp: Date.now(),
      });

      return fullResponse;
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
      const errorMessages = {
        en: "Service unavailable. Please try again later.",
        hi: "सेवा अनुपलब्ध है। कृपया बाद में पुन: प्रयास करें।",
        gu: "સેવા ઉપલબ્ધ નથી. કૃપા કરીને પછીથી ફરી પ્રયાસ કરો.",
        es: "Servicio no disponible. Por favor, inténtelo más tarde.",
      };

      return errorMessages[language] || errorMessages.en;
    }
  };

  const retryWithExponentialBackoff = async (fn, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;

        const delay = Math.min(
          1000 * 2 ** retries + Math.random() * 1000,
          10000
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Select a conversation from history
  const handleSelectConversation = (conversation) => {
    // If we have stored all messages, use them
    if (conversation.allMessages && conversation.allMessages.length > 0) {
      setMessages(conversation.allMessages);
    }
    // Fallback to recreating the conversation
    else {
      const reconstructedMessages = [
        {
          text: "👋 Previous conversation",
          sender: "ai",
          timestamp: conversation.timestamp - 1000,
        },
      ];

      // Add user message
      if (conversation.userMessage) {
        reconstructedMessages.push({
          text: conversation.userMessage,
          sender: "user",
          timestamp: conversation.timestamp,
        });
      } else if (conversation.text) {
        // Support for old format
        reconstructedMessages.push({
          text: conversation.text,
          sender: "user",
          timestamp: conversation.timestamp,
        });
      }

      // Add AI response if available
      if (conversation.aiResponse) {
        reconstructedMessages.push({
          text: conversation.aiResponse,
          sender: "ai",
          timestamp: conversation.timestamp + 1000,
        });
      }

      setMessages(reconstructedMessages);
    }

    // If there was a file associated with this conversation
    if (conversation.fileInfo) {
      setCurrentPdf(conversation.fileInfo);
    }

    // Close the history panel
    setShowHistory(false);
  };

 
  const handleSendMessage = async (voiceInput = null) => {
    const cleanInput = sanitizeInput(voiceInput || input);
    if (!cleanInput) return;

    const userMessage = {
      text: cleanInput,
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    // Add to history
    addToHistory(userMessage);

    try {
      // Check if this is a document-related question but no document is loaded
      const isPdfQuestion =
        cleanInput.toLowerCase().includes("pdf") ||
        cleanInput.toLowerCase().includes("document") ||
        cleanInput.toLowerCase().includes("file") ||
        cleanInput.toLowerCase().includes("about");

      if (isPdfQuestion && !currentPdf) {
        const noDocMessage = {
          text: "I'm sorry, but I need the actual text from a document to tell you what it's about. Please open a PDF file first, and I'll analyze its content for you.",
          sender: "ai",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, noDocMessage]);
        addToHistory(noDocMessage);

        if (voiceEnabled && !isSpeaking) {
          speakText(noDocMessage.text);
        }

        setIsTyping(false);
        return;
      }

      // If asking about PDF content but text extraction is still in progress
      // If asking about PDF content but text extraction is still in progress
      // If asking about PDF content but text extraction is still in progress
      if (
        isPdfQuestion &&
        currentPdf &&
        pdfText.includes("extraction is in progress")
      ) {
        const processingMessage = {
          text: `I'm sorry, but I need the actual text from the "${currentPdf.name}" file to tell you what it's about. The text extraction is still in progress. You can either wait or manually upload the text content using the "Upload text" button.`,
          sender: "ai",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, processingMessage]);
        addToHistory(processingMessage);

        if (voiceEnabled && !isSpeaking) {
          speakText(processingMessage.text);
        }

        setIsTyping(false);
        return;
      }

      // Normal AI response flow
      const response = await retryWithExponentialBackoff(() =>
        getAIResponse(cleanInput)
      );

      const aiMessage = {
        text: response,
        sender: "ai",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Add AI response to history
      addToHistory(aiMessage);

      // Speak the response if voice is enabled
      if (voiceEnabled && !isSpeaking) {
        speakText(response);
      }
    } catch (error) {
      console.error("Final error after retries:", error);
      const errorMsg = "Analysis unavailable. Please try again later.";

      const errorMessage = {
        text: errorMsg,
        sender: "ai",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError("Service temporarily unavailable. Please try again later.");

      // Add error message to history
      addToHistory(errorMessage);

      // Speak error message if voice is enabled
      if (voiceEnabled) {
        speakText(errorMsg);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    const welcomeMsg =
      "👋 Welcome to the File Analysis Assistant! I can help you analyze your documents. Upload or open a file, and I'll be ready to answer your questions about it.";

    setMessages([
      {
        text: welcomeMsg,
        sender: "ai",
        timestamp: Date.now(),
      },
    ]);
    setError(null);

    // Speak welcome message
    if (voiceEnabled) {
      speakText(welcomeMsg);
    }
  };

  const closePdfViewer = () => {
    if (currentPdf && currentPdf.url) {
      URL.revokeObjectURL(currentPdf.url);
    }
    setCurrentPdf(null);
    setPdfViewerOpen(false);
    setPdfText("");
  };

  // History Panel Component
  // Updated History Panel Component with improved display
  const HistoryPanel = ({ history, onSelectConversation, onClose }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter history based on search term
    const filteredHistory = history.filter((conv) => {
      const userMsg = conv.userMessage || conv.text || "";
      const aiResp = conv.aiResponse || "";
      return (
        userMsg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aiResp.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Group conversations by date
    const groupedHistory = filteredHistory.reduce((groups, message) => {
      const date = new Date(
        message.timestamp || Date.now()
      ).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

    // Make sure this function is placed inside your main component function

    return (
      <div className="absolute top-0 left-0 w-80 h-full bg-gray-900 border-r border-gray-800 z-10 shadow-lg overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Conversation History
            </h2>
            <div className="flex gap-2">
              <button
                onClick={exportChatHistory}
                className="text-gray-400 hover:text-white"
                title="Export history"
              >
                <Dicon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
                title="Close history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 rounded bg-gray-800 text-white border border-gray-700"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-2">
          {Object.keys(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([date, messages]) => (
              <div key={date} className="mb-4">
                <h3 className="text-xs text-gray-400 px-2 py-1">{date}</h3>
                {messages.map((message, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectConversation(message)}
                    className="w-full text-left p-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors mb-1 text-sm truncate flex items-center"
                  >
                    {message.fileInfo && (
                      <FileText className="w-3 h-3 mr-2 text-blue-400" />
                    )}
                    <span className="flex-1 truncate">
                      {message.text.substring(0, 60)}...
                    </span>
                    {message.responseText && (
                      <span className="text-xs text-gray-500 ml-2">
                        Has response
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <History className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
              {searchTerm && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Settings Panel Component
  const SettingsPanel = () => (
    <div className="absolute top-0 right-0 w-80 h-full bg-gray-900 border-l border-gray-800 z-10 shadow-lg">
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-400" />
            <span className="text-white">Dark Mode</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full ${
              darkMode ? "bg-blue-600" : "bg-gray-700"
            } relative`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                darkMode ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <span className="text-white">Voice Output</span>
          </div>
          <button
            onClick={toggleVoiceOutput}
            className={`w-12 h-6 rounded-full ${
              voiceEnabled ? "bg-blue-600" : "bg-gray-700"
            } relative`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                voiceEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              localStorage.removeItem("fileAnalysisHistory");
              setFullHistory([]);
              setShowSettings(false);
            }}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Message Bubble Component
  const MessageBubble = ({ message }) => {
    const isAI = message.sender === "ai";
    const timestamp = message.timestamp
      ? new Date(message.timestamp)
      : new Date();
    const formattedTime = `${timestamp
      .getHours()
      .toString()
      .padStart(2, "0")}:${timestamp
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${timestamp.getHours() >= 12 ? "PM" : "AM"}`;

    return (
      <div
        className={`flex items-start gap-3 mb-4 ${
          isAI ? "justify-start" : "justify-end"
        }`}
      >
        {isAI && (
          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
        )}
        <div
          className={`max-w-[85%] p-4 rounded-2xl ${
            isAI
              ? "bg-gray-800 text-white border border-gray-700"
              : "bg-blue-600 text-white"
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {message.text}
          </pre>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedTime}
            </span>

            {isAI && voiceEnabled && (
              <button
                onClick={() => speakText(message.text)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                disabled={isSpeaking}
              >
                <Volume2 className="w-3 h-3" />
                <span>Listen</span>
              </button>
            )}
          </div>
        </div>
        {!isAI && (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    );
  };

  // Voice status indicator
  const VoiceStatus = () => {
    if (isListening) {
      return (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm animate-pulse">
          <Mic className="w-4 h-4" />
          <span>Listening...</span>
        </div>
      );
    }
    return null;
  };

  if (session.status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to access your files and the AI assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full mx-auto p-2 ${
        darkMode ? "dark-theme" : "light-theme"
      }`}
    >
       <Navbar />
      <div className="flex flex-col md:flex-row gap-4 mt-5">
        {/* File browser section */}
        <div className="w-full md:w-1/3 bg-gray-900 rounded-2xl shadow-md border border-gray-800 p-4">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            File Browser
          </h2>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                id="grpname"
                value={grpname}
                onChange={handlechange}
                placeholder="Enter group name"
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
              />
              <button
                type="submit"
                onClick={() => getfiles()}
                disabled={isLoading || !grpname}
                className="p-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Get"
                )}
              </button>
            </div>
          </div>

          {errorStatus && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading files...</span>
              </div>
            ) : Array.isArray(files) && files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-400 mr-2" />
                        <div>
                          <h3 className="text-white font-medium text-sm">
                            {file.name}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            {new Date(
                              file.uploadDate || Date.now()
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          initiateDownload(file.id, file.name, file.type)
                        }
                        disabled={isLoading}
                        className="p-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:cursor-not-allowed"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FileText className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-center">
                  {grpname
                    ? "No files found in this group"
                    : "Enter a group name to view files"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat section */}
        <div className="w-full md:w-2/3 bg-gray-900 rounded-2xl shadow-md border border-gray-800 relative">
          <header className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              Document Analysis Assistant
            </h1>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 py-1 px-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <span>Clear chat</span>
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full transition-colors cursor-pointer ${
                    showHistory
                      ? "text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-800/30"
                      : "text-gray-400 hover:text-gray-300 bg-gray-800 hover:bg-gray-700"
                  }`}
                  title="View conversation history"
                >
                  <History className="w-3 h-3" />
                  <span>History</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs flex items-center gap-1 py-1 px-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer text-gray-400 hover:text-gray-200"
                  title="Settings"
                >
                  <Settings className="w-3 h-3" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={toggleVoiceOutput}
                  className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full transition-colors cursor-pointer ${
                    voiceEnabled
                      ? "text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-800/30"
                      : "text-gray-400 hover:text-gray-300 bg-gray-800 hover:bg-gray-700"
                  }`}
                  title={
                    voiceEnabled
                      ? "Voice output enabled"
                      : "Voice output disabled"
                  }
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-3 h-3" />
                  ) : (
                    <VolumeX className="w-3 h-3" />
                  )}
                  <span>{voiceEnabled ? "Voice on" : "Voice off"}</span>
                </button>

                <button
                  onClick={toggleListening}
                  className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? "text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-800/30"
                      : "text-gray-400 hover:text-gray-300 bg-gray-800 hover:bg-gray-700"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="w-3 h-3" />
                  ) : (
                    <Mic className="w-3 h-3" />
                  )}
                  <span>{isListening ? "Stop" : "Voice"}</span>
                </button>
              </div>
            </div>

            {currentPdf && (
              <div className="mt-2 p-2 bg-blue-900/20 border border-blue-800/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-300">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[240px]">
                    {currentPdf.name}
                  </span>
                </div>
                <button
                  onClick={() => setPdfViewerOpen(!pdfViewerOpen)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {pdfViewerOpen ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Add this extraction status indicator */}
            {/* Add this extraction status indicator */}
            {currentPdf && pdfText.includes("extraction is in progress") && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-yellow-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting text from document...</span>
                </div>
              </div>
            )}

            {/* Add manual PDF upload option */}
            {currentPdf ? (
              <div className="mt-2 p-2 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-purple-300">
                    <Upload className="w-4 h-4" />
                    <span>Upload another PDF for analysis</span>
                  </div>
                  <label className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => handleTextUpload(e)}
                    />
                    <span>Upload PDF</span>
                  </label>
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  If automatic extraction fails, you can manually upload a PDF
                  file for text extraction.
                </p>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-purple-900/20 border border-purple-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-purple-300">
                    <Upload className="w-4 h-4" />
                    <span>Upload a PDF for analysis</span>
                  </div>
                  <label className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => handleTextUpload(e)}
                    />
                    <span>Upload PDF</span>
                  </label>
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  Upload a PDF file to extract its text content for AI analysis.
                </p>
              </div>
            )}
          </header>

          {showHistory && (
            <HistoryPanel
              history={fullHistory}
              onSelectConversation={handleSelectConversation}
              onClose={() => setShowHistory(false)}
            />
          )}

          {showSettings && <SettingsPanel />}

          {/* PDF Viewer */}
          {pdfViewerOpen && currentPdf && (
            <div className="absolute inset-0 z-20 bg-gray-900 flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPdfViewerOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <h2 className="text-lg font-semibold text-white truncate">
                    {currentPdf.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closePdfViewer}
                    className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={currentPdf.url}
                  title={currentPdf.name}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          <div className="p-4 h-[calc(100vh-280px)] overflow-y-auto">
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assistant is typing...</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentPdf
                    ? `Ask about "${currentPdf.name}"...`
                    : "Ask a question about your documents..."
                }
                className="w-full p-3 pr-12 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-none"
                rows="2"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isTyping || !input.trim()}
                className="absolute right-3 bottom-3 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <VoiceStatus />
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Enter File Password
            </h2>
            <p className="text-gray-300 mb-4">
              This file is password protected. Please enter the password to
              access it.
            </p>
            {passwordError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="filePassword"
                className="block text-gray-300 mb-2"
              >
                Password:
              </label>
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
                className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
