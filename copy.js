const synth = window.speechSynthesis;
const IMAGE_INTERVAL_MS = 1000;

let voices = [];

function populateVoiceList() { 
  voices = synth.getVoices().sort(function (a, b) {
    const aname = a.name.toUpperCase();
    const bname = b.name.toUpperCase();
    if (aname < bname) {
      return -1;
    } else if (aname == bname) {
      return 0;
    } else {
      return +1;
    }
  });
  
}

populateVoiceList();

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}


const drawFaceRectangles = (video, canvas,{x, y, width, height}) => {
  // console.log( {x, y, width, height})
  
  const ctx = canvas.getContext('2d');
  ctx.width = video.videoWidth;
  ctx.height = video.videoHeight;
//   ctx.font = "20px Georgia";
//   ctx.fillText("Hello World!", 10, 50);
      ctx.beginPath();
      
      
      ctx.clearRect(0, 0, ctx.width, ctx.height);
      ctx.lineWidth = "3"
      ctx.strokeStyle = "#49fb35";
      ctx.beginPath();
      ctx.rect(x/1.55, y/1.55, width, height);
      console.log(x, y, width, height);
      ctx.stroke();
      
};

const startFaceDetection = (video, canvas, deviceId) => {
  //  const socket = new WebSocket('ws://localhost:8000/face-detection');
  //  const socket = new WebSocket('ws://localhost:8000/detector');
  //  const socket = new WebSocket('ws://hand-test.herokuapp.com/detector');
  const socket = new WebSocket('wss://socket-fastapi-gesture-detection-bdv72qo4da-em.a.run.app/detector');


  // const socket = new WebSocket('ws://face-tracking-websocket.herokuapp.com/face-detection');

  let intervalId;
  // console.log(deviceId)

  // Connection opened
  socket.addEventListener('open', function () {

    // Start reading video from device
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId,
        width: { max: 640 },
        height: { max: 480 },
      },
    }).then(function (stream) {
      video.srcObject = stream;
      video.play().then(() => {
        // Adapt overlay canvas size to the video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Send an image in the WebSocket every 42 ms
        intervalId = setInterval(() => {

          // Create a virtual canvas to draw current video image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Convert it to JPEG and send it to the WebSocket
          canvas.toBlob((blob) => socket.send(blob), 'image/jpeg');
        }, IMAGE_INTERVAL_MS);
      });
    });
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    // console.log(JSON.parse(event.data));
    // drawFaceRectangles(video, canvas, JSON.parse(event.data));
    const data = JSON.parse(event.data)
    drawFaceRectangles(video, canvas, data.box);
    console.log(data.label)
    speak(data.label)

  });

  // Stop the interval and video reading on close
  socket.addEventListener('close', function () {
    window.clearInterval(intervalId);
    video.pause();
  });

  return socket;
};

window.addEventListener('DOMContentLoaded', (event) => {
  console.log("event noticed")
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const cameraSelect = document.getElementById('camera-select');
  let socket;

  // List available cameras and fill select
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    for (const device of devices) {
      
      if (device.kind === 'videoinput' ) {
        console.log("video source found")
        const deviceOption = document.createElement('option');
        deviceOption.value = device.deviceId;
        deviceOption.innerText = device.label;
        cameraSelect.appendChild(deviceOption);
      }
    }
  });

  // Start face detection on the selected camera on submit
  document.getElementById('form-connect').addEventListener('submit', (event) => {
    event.preventDefault();

    // Close previous socket is there is one
    if (socket) {
      socket.close();
    }
    console.log(cameraSelect)
    const deviceId = cameraSelect.selectedOptions[0].value;
    socket = startFaceDetection(video, canvas, deviceId);
    
    
  });

});



document.getElementById('button-take-snap').addEventListener('click', (event)=> {
  
  event.preventDefault();

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas'); 
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);


  canvas.toBlob((blob) => {
    const formData = new FormData();
    formData.append("file",blob,"test")
    // fetch('http://localhost:8000/files/', {
    fetch('https://hand-test.herokuapp.com/files/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
            // 'Content-Type': 'multipart/form-data'
        },
        body: formData
    })
    .then(response => response.json())
    .then(response => console.log(JSON.stringify(response)))  
  }, 'image/jpeg')

})




window.addEventListener("keypress",(event)=> {
    // console.log(event);
    if (event.key == ' '){
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas'); 
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);


        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append("file",blob,"test")
            fetch('http://localhost:8000/files/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                    // 'Content-Type': 'multipart/form-data'
                },
                body: formData
            })
            .then(response => response.json())
            .then(response => {
                console.log(response);
                console.log(response.file_size.box)
                drawFaceRectangles( response.file_size.box);
            })  
        }, 'image/jpeg')
    }
})


document.getElementById('button-stop').addEventListener('click',(event)=> {
  event.preventDefault();
  console.log("stop")
  const video = document.getElementById('video');
  const tracks = video.srcObject.getTracks();
  for(let i=0; i<tracks.length; i++){
    tracks[i].stop();
  }
})



const inputForm = document.querySelector("#speech-form");
function speak(message) {
  // if (synth.speaking) {
  //   console.error("speechSynthesis.speaking");
  //   return;
  // }
  if (message !== "") {
    const utterThis = new SpeechSynthesisUtterance(message);
    // utterThis.onend = function (event) {
    //   console.log("SpeechSynthesisUtterance.onend");
    // };
    utterThis.onerror = function (event) {
      console.error("SpeechSynthesisUtterance.onerror");
    };
    const selectedOption = "Google हिन्दी"
    utterThis.voice =voices.find( voice => voice.name === selectedOption )
    synth.speak(utterThis);
  }
}

document.getElementById("play").addEventListener('click', (event)=>{
  event.preventDefault();

  speak("atharva");
  speak("ध न प फ ब भ म य र ल व श ष स ह श्र क्ष त्र ञ");
  
})

