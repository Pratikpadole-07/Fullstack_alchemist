import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";

function LivenessCheck() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCascade = useRef(null);
  const eyeCascade = useRef(null); // NEW: Eye classifier

  const [status, setStatus] = useState("Initializing...");
  const [isCvReady, setIsCvReady] = useState(false);
  const [blinks, setBlinks] = useState(0); // Track blinks
  const [isLive, setIsLive] = useState(false);

  // Use a ref for blinks to access it inside the animation loop without stale closures
  const blinkCounter = useRef(0);
  const wasEyesVisible = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadOpenCV = () => {
      if (!document.getElementById("opencv-script")) {
        const script = document.createElement("script");
        script.id = "opencv-script";
        script.src = OPENCV_URL;
        script.async = true;
        document.body.appendChild(script);
      }

      const checkReady = () => {
        if (window.cv && window.cv.Mat) setupClassifiers();
        else setTimeout(checkReady, 500);
      };
      checkReady();
    };

    const setupClassifiers = async () => {
      try {
        const cv = window.cv;
        // Load both Face and Eye models
        const files = [
          { name: "face.xml", url: "/haarcascade_frontalface_default.xml" },
          { name: "eye.xml", url: "/haarcascade_eye.xml" }
        ];

        for (const file of files) {
          const res = await fetch(file.url);
          const data = new Uint8Array(await res.arrayBuffer());
          cv.FS_createDataFile("/", file.name, data, true, false, false);
        }

        faceCascade.current = new cv.CascadeClassifier();
        faceCascade.current.load("face.xml");
        
        eyeCascade.current = new cv.CascadeClassifier();
        eyeCascade.current.load("eye.xml");

        setIsCvReady(true);
        setStatus("Blink 3 times to verify");
      } catch (err) {
        setStatus("Model Load Error");
      }
    };

    loadOpenCV();
    return () => (isMounted = false);
  }, []);

  useEffect(() => {
    if (!isCvReady || isLive) return;
    let requestID;
    const processVideo = () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) detect(video);
      requestID = requestAnimationFrame(processVideo);
    };
    processVideo();
    return () => cancelAnimationFrame(requestID);
  }, [isCvReady, isLive]);

  const detect = (video) => {
    const cv = window.cv;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let faces = new cv.RectVector();
    let eyes = new cv.RectVector();

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      faceCascade.current.detectMultiScale(gray, faces, 1.1, 3, 0);

      if (faces.size() > 0) {
        const face = faces.get(0);
        // Draw face box
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(face.x, face.y, face.width, face.height);

        // Crop to the face region to find eyes (Optimization)
        let faceROI = gray.roi(face);
        eyeCascade.current.detectMultiScale(faceROI, eyes);

        // BLINK LOGIC
        // If eyes were visible and now they aren't -> Count as 1 blink
        if (eyes.size() >= 2) {
          wasEyesVisible.current = true;
        } else if (eyes.size() === 0 && wasEyesVisible.current) {
          blinkCounter.current += 1;
          setBlinks(blinkCounter.current);
          wasEyesVisible.current = false;
          
          if (blinkCounter.current >= 3) {
            setIsLive(true);
            setStatus("Liveness Verified!");
          }
        }
        faceROI.delete();
      }
    } finally {
      src.delete(); gray.delete(); faces.delete(); eyes.delete();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-gray-900 p-8 rounded-2xl">
      <div className="relative">
        <Webcam ref={webcamRef} className="w-[640px] rounded-lg" mirrored={false} />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
        
        {/* Overlay Progress */}
        <div className="absolute top-4 right-4 bg-black/60 p-4 rounded text-white">
            <p>Blinks: {blinks} / 3</p>
            {isLive && <p className="text-green-400 font-bold">✓ LIVE</p>}
        </div>
      </div>
      <div className={`p-4 rounded-lg font-bold ${isLive ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
        {status}
      </div>
    </div>
  );
}

export default LivenessCheck;