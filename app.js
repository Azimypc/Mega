/* =========================================================
   IoT RGB Controller - app.js
   This file connects our webpage to Firebase Realtime Database.

   The ESP8266 only listens to ONE path:

     LivingRoom/Lamp

   Every button sends its command to that SAME path.
   Because Lamp only ever holds the LAST command sent (not the
   full state of all 3 LEDs), we keep each LED's ON/OFF state
   in simple local JavaScript variables.

   The flow of data looks like this:

   Web Button
     -> JavaScript (this file)
       -> Firebase Realtime Database (LivingRoom/Lamp)
         -> ESP8266
           -> Serial Communication
             -> Arduino Mega
               -> RGB LED

   We use the Firebase Web SDK (ES Modules version) loaded
   directly from Google's CDN using "import" statements.
   ========================================================= */

// Import the Firebase functions we need from the official CDN.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* =========================================================
   STEP 1: PASTE YOUR FIREBASE CONFIGURATION HERE
   ---------------------------------------------------------
   Go to your Firebase project settings, copy the config
   object, and paste it below, replacing the placeholder text.
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyCWf2EYQDUoxDSqSPSHLXkJs8r7LgqibF0",
  authDomain: "temp-9b830.firebaseapp.com",
  databaseURL: "https://temp-9b830-default-rtdb.firebaseio.com",
  projectId: "temp-9b830",
  storageBucket: "temp-9b830.firebasestorage.app",
  messagingSenderId: "739938053762",
  appId: "1:739938053762:web:5446bdd84e6ea5e0ce8e9b"
};

// Initialize Firebase using the config above.
const app = initializeApp(firebaseConfig);

// Get a reference to the Realtime Database.
const database = getDatabase(app);

/* =========================================================
   STEP 2: DATABASE PATH
   ---------------------------------------------------------
   ONE shared reference used by all three buttons.
   The ESP8266 is only listening to this exact path.

   .info/connected -> a special Firebase path that tells us
                       if we are connected to the database
   ========================================================= */
const lampRef = ref(database, "LivingRoom/Lamp");
const connectedRef = ref(database, ".info/connected");

// The command numbers sent to LivingRoom/Lamp.
const RED_ON = 2;
const RED_OFF = 3;
const BLUE_ON = 0;
const BLUE_OFF = 1;
const GREEN_ON = 4;
const GREEN_OFF = 5;

/* =========================================================
   STEP 3: GRAB OUR HTML ELEMENTS
   ========================================================= */
const btnRed = document.getElementById("btnRed");
const btnGreen = document.getElementById("btnGreen");
const btnBlue = document.getElementById("btnBlue");

const redState = document.getElementById("redState");
const greenState = document.getElementById("greenState");
const blueState = document.getElementById("blueState");

const ledRed = document.getElementById("ledRed");
const ledGreen = document.getElementById("ledGreen");
const ledBlue = document.getElementById("ledBlue");

const currentColorText = document.getElementById("currentColorText");
const connectionDot = document.getElementById("connectionDot");
const connectionText = document.getElementById("connectionText");
const connectionState = document.getElementById("connectionState");

/* =========================================================
   STEP 4: LOCAL ON/OFF STATE FOR EACH LED
   ---------------------------------------------------------
   LivingRoom/Lamp only stores the LAST command sent, so it
   cannot tell us the full state of all 3 LEDs by itself.
   That's why we keep track of each LED's state ourselves.
   ========================================================= */
let redOn = false;
let blueOn = false;
let greenOn = false;

/* =========================================================
   STEP 5: HELPER TO UPDATE THE "ACTIVE LEDS" SUMMARY TEXT
   ========================================================= */
function updateActiveSummary() {
  const activeColors = [];
  if (redOn) activeColors.push("RED");
  if (greenOn) activeColors.push("GREEN");
  if (blueOn) activeColors.push("BLUE");

  currentColorText.textContent = activeColors.length > 0 ? activeColors.join(", ") : "NONE";
}

/* =========================================================
   STEP 6: RED BUTTON - TOGGLE ON/OFF
   ---------------------------------------------------------
   Clicking RED only changes redOn. It never touches
   blueOn or greenOn.
   ========================================================= */
btnRed.addEventListener("click", () => {
  redOn = !redOn;

  if (redOn) {
    console.log("RED ON -> Sending 0 to LivingRoom/Lamp");
    set(lampRef, RED_ON);
  } else {
    console.log("RED OFF -> Sending 1 to LivingRoom/Lamp");
    set(lampRef, RED_OFF);
  }

  ledRed.classList.toggle("on-red", redOn);
  btnRed.classList.toggle("active", redOn);
  redState.textContent = redOn ? "ON" : "OFF";
  updateActiveSummary();
});

/* =========================================================
   STEP 7: BLUE BUTTON - TOGGLE ON/OFF
   ========================================================= */
btnBlue.addEventListener("click", () => {
  blueOn = !blueOn;

  if (blueOn) {
    console.log("BLUE ON -> Sending 2 to LivingRoom/Lamp");
    set(lampRef, BLUE_ON);
  } else {
    console.log("BLUE OFF -> Sending 3 to LivingRoom/Lamp");
    set(lampRef, BLUE_OFF);
  }

  ledBlue.classList.toggle("on-blue", blueOn);
  btnBlue.classList.toggle("active", blueOn);
  blueState.textContent = blueOn ? "ON" : "OFF";
  updateActiveSummary();
});

/* =========================================================
   STEP 8: GREEN BUTTON - TOGGLE ON/OFF
   ========================================================= */
btnGreen.addEventListener("click", () => {
  greenOn = !greenOn;

  if (greenOn) {
    console.log("GREEN ON -> Sending 4 to LivingRoom/Lamp");
    set(lampRef, GREEN_ON);
  } else {
    console.log("GREEN OFF -> Sending 5 to LivingRoom/Lamp");
    set(lampRef, GREEN_OFF);
  }

  ledGreen.classList.toggle("on-green", greenOn);
  btnGreen.classList.toggle("active", greenOn);
  greenState.textContent = greenOn ? "ON" : "OFF";
  updateActiveSummary();
});

/* =========================================================
   STEP 9: LISTEN FOR REALTIME CHANGES TO LivingRoom/Lamp
   ---------------------------------------------------------
   This just logs the latest command for teaching purposes.
   It does NOT drive the button UI, since Lamp only holds the
   last command, not the full state of all 3 LEDs.
   ========================================================= */
onValue(lampRef, (snapshot) => {
  const value = snapshot.val();
  console.log("LivingRoom/Lamp changed:", value);
});

/* =========================================================
   STEP 10: LISTEN FOR FIREBASE CONNECTION STATUS
   ---------------------------------------------------------
   ".info/connected" is a special Firebase path that tells us
   true/false depending on whether we are online.
   ========================================================= */
onValue(connectedRef, (snapshot) => {
  const isConnected = snapshot.val();

  if (isConnected === true) {
    console.log("Firebase connected");
    connectionDot.classList.remove("offline");
    connectionDot.classList.add("online");
    connectionText.textContent = "Firebase Connected";
    connectionState.textContent = "ONLINE";
  } else {
    console.log("Firebase offline");
    connectionDot.classList.remove("online");
    connectionDot.classList.add("offline");
    connectionText.textContent = "Firebase Offline";
    connectionState.textContent = "OFFLINE";
  }
});

