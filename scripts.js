let imageLoader = document.getElementById("imageLoader");
imageLoader.addEventListener("change", writeInitialImage, false);
let originalCanvas = document.getElementById("originalCanvas");
let originalContext = originalCanvas.getContext("2d");
let resizedCanvas = document.getElementById("resizedCanvas");
let resizedContext = resizedCanvas.getContext("2d");
let imageUploaded = false;

let emojiCount = [0,0,0,0,0,0,0,0];
let gaymojiCount = [0,0,0,0,0,0,0,0];
let defaultEmojis = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬜", "⬛"];
let defaultGaymojis = ["💖", "🧡", "💛", "🥒", "💙", "🍆", "🤍", "🖤"]; // (❁´◡`❁)
let currentEmojis = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬜", "⬛"];
let currentGaymojis = ["💖", "🧡", "💛", "🥒", "💙", "🍆", "🤍", "🖤"];

// I've removed brown because an inordinate amount of colors will map to it and a lot
// of images end up being 90% brown. I'm not smart enough to fix this, but if your 
// character class is Color Mathematician, I'd love to hear from you on how this can 
// be worked around to get a more natural mapping.
//     [142, 86, 46],   //🟫

async function copyOutput() {
    let tempInput = document.createElement("textarea");
    tempInput.value = document.getElementById("emojiContainer").innerHTML.replaceAll("<br>", "\n");
    tempInput.select();
    tempInput.setSelectionRange(0,999999);
    
    try {
        await navigator.clipboard.writeText(tempInput.value);
        
        document.getElementById("copyButton").value = "Copied! ✓";

        window.setTimeout(() => {
            document.getElementById("copyButton").value = "Copy";
        }, 3000);
    } catch (err) {
        alert("Failed to copy to clipboard:\n" + err);
    }
}

let referenceColors = [
    [255, 0, 0],     //🟥
    [247, 99, 12],   //🟧
    [255, 241, 0],   //🟨
    [0, 255, 0],     //🟩
    [0, 0, 255],     //🟦
    [170, 0, 255],   //🟪
    [255, 255, 255], //⬜
    [0, 0, 0]        //⬛
];

function writeInitialImage(referer){
    let reader = new FileReader();
    reader.onload = function(event){
        let img = new Image();
        img.onload = function(){
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            originalContext.drawImage(img, 0, 0);
            imageUploaded = true;
            emojificate();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(referer.target.files[0]);
}

function emojificate() {
    if(imageUploaded) {
        // Reset counters
        emojiCount = [0,0,0,0,0,0,0,0];
        gaymojiCount = [0,0,0,0,0,0,0,0];

        // Crush img
        let size = Number(document.querySelector('input[name="outputSize"]:checked').value);

        if(originalCanvas.width > size || originalCanvas.height > size) {
            let ratio = Math.min(size / originalCanvas.width, size / originalCanvas.height);
            resizedCanvas.width = Math.ceil(originalCanvas.width * ratio);
            resizedCanvas.height = Math.ceil(originalCanvas.height * ratio);
        } else {
            resizedCanvas.width = originalCanvas.width;
            resizedCanvas.height = originalCanvas.height;
        }

        // Apply any adjustments before drawing
        let brightness = Number(document.getElementById("brightnessSlider").value);
        let contrast = Number(document.getElementById("contrastSlider").value);
        let grayscale = Number(document.getElementById("grayscaleSlider").value);
        let hue = Number(document.getElementById("hueSlider").value);
        let saturation = Number(document.getElementById("saturationSlider").value);
        let sepia = Number(document.getElementById("sepiaSlider").value);
        let invert = Number(document.getElementById("invertSlider").value);
        
        resizedContext.filter = "brightness(" + brightness + "%) contrast(" + contrast + "%) grayscale(" + grayscale + "%) hue-rotate(" + hue + "deg) saturate(" + saturation + "%) sepia(" + sepia + "%) invert(" + invert + "%)";
        resizedContext.drawImage(originalCanvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
        
        // Iterate through each pixel
        let emojiStr = "";
        let imgData = resizedContext.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);

        // Draw the emojis
        for(let i = 0; i < imgData.data.length; i += 4) {
            let r = imgData.data[i], g = imgData.data[i+1], b = imgData.data[i+2], a = imgData.data[i+3];
            
            // If 1-bit, check if any pixel has any rgb value less than the threshold to determine whether its emoji should be black or white
            if(document.getElementById("monochromeCheckBox").checked) {
                let threshold = Number(document.getElementById("monochromeThresholdSlider").value);
                let monochromeInvert = document.getElementById("monochromeInvertCheckBox").checked;
                
                if(r < threshold || g < threshold || b < threshold) {
                    let val = monochromeInvert ? 255 : 0;
                    r = val; g = val; b = val;
                } else {
                    let val = monochromeInvert ? 0 : 255;
                    r = val; g = val; b = val;
                }
                a = 255; // Ignore alpha in 1-bit mode
            }

            let emojiIndex = 0;
            if(a < 170) {
                emojiIndex = Number(document.getElementById("transparencyKey").value); // If alpha channel is less than 170, set to transparency key. This number is arbitrarily set
            } else {
                // Calculate the difference between our reference colors and the current pixel's colors
                let colorDifferences = [];
                for(let currentColor = 0; currentColor < referenceColors.length; currentColor++) {
                    colorDifferences.push(Math.sqrt((r - referenceColors[currentColor][0])**2 + (g - referenceColors[currentColor][1])**2 + (b - referenceColors[currentColor][2])**2));
                }

                emojiIndex = colorDifferences.indexOf(Math.min(...colorDifferences));
            }
            
            emojiCount[emojiIndex]++;
            if(document.getElementById("gayCheckBox").checked) {
                emojiStr += currentGaymojis[emojiIndex];
            } else {
                emojiStr += currentEmojis[emojiIndex];
            }

            // Line break when new image row starts
            let currentPixel = 0;
            if(i > 0 && i % 4 == 0) {
                currentPixel = i / 4;
            }

            if(currentPixel > 0 && i % 4 == 0 && (currentPixel + 1) % resizedCanvas.width == 0) {
                emojiStr += "<br>";
            }
        }

        document.getElementById("emojiContainer").innerHTML = emojiStr;

        document.getElementById("canvasAreaContainer").classList.remove("hidden");
        document.getElementById("emojiAreaContainer").classList.remove("hidden");

        updateStats();
    }
}

function updateStats() {
    let str = "";
    let isGay = document.getElementById("gayCheckBox").checked;
    let arr = isGay ? defaultGaymojis.slice(0) : defaultEmojis.slice(0);
    let currImg = document.getElementById("emojiContainer").innerHTML.trim();
    arr.push(isGay ? "🤎" : "🟫"); // This is only used as a replacement for reasons mentioned near the top

    let runningTotal = 0;
    for(let i = 0; i < arr.length; i++) {
        let count = (currImg.match(new RegExp(arr[i], "g")) || []).length;
        runningTotal += count;
        
        let outputMoji = arr[i];
        if(arr[i] == "⬛" || arr[i] == "🖤") {
            outputMoji = "<span class='blackBox'>" + arr[i] + "</span>";
        }
        str += outputMoji + " " + count + " ";
    }
    
    document.getElementById("colorDistributionArea").innerHTML = "Color distribution: " + str;
    document.getElementById("imageStatsArea").innerHTML = "Dimensions: " + resizedCanvas.width + "x" + resizedCanvas.height;
}

function updateSliderLabel(which) {
    let unit = "%";
    let label = which;

    if(which == "hue") {
        unit = "°";
        label = "Hue rotation";
    } else if(which == "invert") {
        label = "Invert colors";
    } else if(which == "monochromeThreshold") {
        unit = "";
        label = "1-bit threshold";
    }

    document.getElementById(which + "SliderLabel").innerText = label[0].toUpperCase() + label.substring(1) + " (" + document.getElementById(which + "Slider").value + unit + ")";

    emojificate();
}

function updateCustomColors(reset) {
    if(reset) {
        currentEmojis = defaultEmojis.slice(0);
        currentGaymojis = defaultGaymojis.slice(0);
    }
    
    let elements = document.querySelectorAll("select[id^='repaint']");
    for(let i = 0; i < elements.length; i++) {
        if(reset) {
            elements[i].value = defaultEmojis[i];
        } else {
            currentEmojis[i] = elements[i].value;
            currentGaymojis[i] = elements[i].options[elements[i].selectedIndex].getAttribute("data-gaymoji");
        }
    }

    emojificate();
}

function resetAdjustments() {
    let sliders = ["brightness", "contrast", "grayscale", "hue", "saturation", "sepia", "invert", "monochromeThreshold"];

    document.getElementById("brightnessSlider").value = 100;
    document.getElementById("contrastSlider").value = 100;
    document.getElementById("grayscaleSlider").value = 0;
    document.getElementById("hueSlider").value = 0;
    document.getElementById("saturationSlider").value = 100;
    document.getElementById("sepiaSlider").value = 0;
    document.getElementById("invertSlider").value = 0;
    document.getElementById("monochromeThresholdSlider").value = 128;

    document.getElementById("monochromeCheckBox").checked = false;
    document.getElementById("monochromeInvertCheckBox").checked = false;
    document.getElementById("gayCheckBox").checked = false;

    for(let i = 0; i < sliders.length; i++) {
        updateSliderLabel(sliders[i]);
    }
}

function resetImage() {
    document.getElementById("imageLoader").value = null;
    document.getElementById("size1").checked = true;
    document.getElementById("transparencyKey").selectedIndex = 6;
    location.reload();
}
