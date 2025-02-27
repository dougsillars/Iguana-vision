(() => {

  const DETECTION_INTERVAL_MILLIS = 1000;

  const video = document.querySelector('video');
  const pages = document.querySelectorAll('.page');
  const supportedDiv = document.getElementById('supported');
  const unsupportedDiv = document.getElementById('unsupported');
  const errorMsg = document.getElementById('error-msg');
  const audio = new Audio('audio/llama.mp3');

  let predictionModel = null;

  async function detectLlamas() {

    try {
      const predictions = await predictionModel.classify(video);

      const topResult = predictions[0];
      var result = topResult.className;

      if (result.includes("iguana")) {

        console.log('OMG iguana!', topResult);
        document.body.classList.add('llama');

        audio.play(); // "Llama!"

      } else if (result.includes("badger")) {

        // Just a little easter egg ;-)
        document.body.classList.add('badger');        
        document.body.classList.remove('llama');

      } 
      else {

        console.log('No llama...', predictions);
        document.body.classList.remove('llama', 'badger');

      }

      setTimeout(detectLlamas, DETECTION_INTERVAL_MILLIS);

    } catch(err) {
      console.error('classify error', err);
      showUnsupported(err);
    }

  }

  function startDetection() {

    document.body.classList.add('detecting');
    detectLlamas();

  }

  async function setupCamera() {

    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const constraints = {
      width: {ideal: maxWidth, max: maxWidth},
      height: {ideal: maxHeight, max: maxHeight},
      facingMode: 'environment' // Rear-facing camera if available
     };

    // Need to set dimensions explicitly on the video element for tensorflow
    // (https://github.com/tensorflow/tfjs/issues/322)
    video.width = maxWidth;
    video.height = maxHeight;

    try {
    
      const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: constraints});

      const videoTracks = stream.getVideoTracks();

      console.log('Using video device: ' + videoTracks[0].label);

      stream.oninactive = function() {
        console.log('Stream inactive');
      };

      if ('srcObject' in video) {
        video.srcObject = stream;
      } else {
        video.src = window.URL.createObjectURL(stream);
      }

      try {
        predictionModel = await mobilenet.load();
        startDetection();
      } catch(err) {
        console.error('Tensorflow error', err);
        showUnsupported(err);
      }

    } catch(err) {
      console.error('getUserMedia error', err);
      showUnsupported(err);
    }

  }

  function showSupported() {
    showPage('intro');
    supportedDiv.style.display = 'block';
    unsupportedDiv.style.display = 'none';
  }

  function showUnsupported(error) {
    errorMsg.innerHTML = error;
    showPage('intro');
    unsupportedDiv.style.display = 'block';
    supportedDiv.style.display = 'none';
  }

  function showPage(pageName) {
    pages.forEach(page => {
      page.classList.add('hidden');
    });
    const pageEl = document.getElementById(`page-${pageName}`);
    pageEl.classList.remove('hidden');
  }

  function init() {

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showUnsupported();
      return;
    }

    const btnGo = document.getElementById('btn-go');

    btnGo.addEventListener('click', () => {
      setupCamera();
      showPage('detector');
    });

    showSupported();

    if ('serviceWorker' in navigator) {

      navigator.serviceWorker.register('service-worker.js')
        .then(() => {
          console.log('Service worker successfully registered');
        })
        .catch(err => {
          console.error('Service worker failed to register', err);
        });

    } else {
      console.log('Service workers not supported');
    }

  }

  init();

})();
