const IMAGE_INTERVAL_MS = 100000

const drawFaceRectangles = (video, canvas, {x, y, width, height}) => {
  const ctx = canvas.getContext('2d');
  ctx.width = video.videoWidth;
  ctx.height = video.videoHeight;
  ctx.font = "20px Georgia";
  ctx.fillText("Hello World!", 10, 50);
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
  const socket = new WebSocket('ws://localhost:8000/detector');
  // hand-test.herokuapp.com
  // const socket = new WebSocket('wss://hand-test.herokuapp.com/detector');



  // conda-evi-bdv72qo4da-uc.a.run.app/
  // const socket = new WebSocket('ws://conda-evi-bdv72qo4da-uc.a.run.app/detector');

  // const socket = new WebSocket('wss://slrlc-367413.el.r.appspot.com/detector');
  // const socket = new WebSocket('wss://web-dockerfile-gene-bdv72qo4da-uc.a.run.app/detector');
  // const socket = new WebSocket('wss://web-dockerfile-gene-bdv72qo4da-uc.a.run.app/detector');
  
  
  //  https://web-dockerfile-gene-bdv72qo4da-uc.a.run.app/
  // https://web-dockerfile-gene-bdv72qo4da-uc.a.run.app/

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
        console.log(canvas);
        
        // Send an image in the WebSocket every 42 ms
        let intervalId = setInterval(() => {
          const video = document.getElementById('video');
          // const canvas = document.getElementById('canvas'); 
          // const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => console.log(blob), 'image/jpeg')

          // Create a virtual canvas to draw current video image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          console.log(canvas);
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Convert it to JPEG and send it to the WebSocket
          console.log("trying to send blob")
          canvas.toBlob((blob) => {socket.send(blob); console.log(blob)}, 'image/jpeg');
        }, IMAGE_INTERVAL_MS);
      });
    });
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    
    console.log( JSON.parse(event.data));
    // drawFaceRectangles(video, canvas, JSON.parse(event.data).box);
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
    console.log(deviceId)
    socket = startFaceDetection(video, canvas, deviceId);
  });

});

document.getElementById('button-stop').addEventListener('click',(event)=> {
  console.log(intervalId)
  event.preventDefault();

  console.log("stop")
  socket.close();
  window.clearInterval(intervalId);
  video.pause()
  

})