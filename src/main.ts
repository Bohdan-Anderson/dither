import "./style.css";

const file = document.getElementById("file") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const output = document.getElementById("output") as HTMLImageElement;

// users can drag and drop an image file onto the file input / or select an image file
file.addEventListener("change", handleFileSelect);

function handleFileSelect(event: Event) {
  event.preventDefault();
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // with the canvas image resize to a maximum of 1000px
        const max = 1500;
        if (canvas.width > max || canvas.height > max) {
          if (canvas.width > canvas.height) {
            canvas.height = (canvas.height * max) / canvas.width;
            canvas.width = max;
          } else {
            canvas.width = (canvas.width * max) / canvas.height;
            canvas.height = max;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        applyDither();
      };
      if (!e.target) return;
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }
}

// dither.addEventListener("click", applyDither);

function ditherBayer() {
  if (!ctx) return;
  // 6 grey tones
  const bayerMatrix = [
    [1, 9, 3, 11],
    [13, 5, 15, 7],
    [4, 12, 2, 10],
    [16, 8, 14, 6],
  ];
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const x = (i / 4) % canvas.width;
    const y = Math.floor(i / 4 / canvas.width);
    const threshold = (bayerMatrix[x % 4][y % 4] / 17) * 255;
    if (gray > threshold) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    } else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function applyDither() {
  ditherBayer();

  // copy the canvas to the output image
  const img = new Image();
  img.onload = function () {
    if (!ctx) return;
    output.src = img.src;
  };
  // when creating the image, the data should be saved as a 2 colour png
  img.src = canvas.toDataURL("image/png", 2);
}
