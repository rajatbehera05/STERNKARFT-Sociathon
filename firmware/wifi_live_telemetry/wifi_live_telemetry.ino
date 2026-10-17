/*
 * ==============================================================================
 *  DisasterSense - Live IoT Wi-Fi Telemetry Transmitter
 * ==============================================================================
 *  Streams live sensor data directly to your STERN-X web platform:
 *  Endpoint: http://<YOUR_PC_IP>:5001/api/flood/telemetry
 *
 *  Pin Connections:
 *  ------------------------------------------------------------------------------
 *  Component             Component Pin    ESP32 Pin / Voltage Rail
 *  ------------------------------------------------------------------------------
 *  HC-SR04 Ultrasonic    VCC              5V / VIN (from USB)
 *  HC-SR04 Ultrasonic    GND              GND
 *  HC-SR04 Ultrasonic    TRIG             GPIO 5
 *  HC-SR04 Ultrasonic    ECHO             GPIO 18 (via 1k / 2k voltage divider)
 *
 *  DHT11 Temp & Humidity VCC              3V3
 *  DHT11 Temp & Humidity GND              GND
 *  DHT11 Temp & Humidity DATA / S         GPIO 4
 *
 *  Soil Moisture Sensor  VCC              3V3
 *  Soil Moisture Sensor  GND              GND
 *  Soil Moisture Sensor  AO / AOUT        GPIO 34 (ADC1 Channel 6)
 *
 *  Red Indicator LED     Anode (+)        GPIO 19 (through 330 ohm resistor)
 *  Red Indicator LED     Cathode (-)      GND
 *
 *  Green Indicator LED   Anode (+)        GPIO 22 (through 330 ohm resistor)
 *  Green Indicator LED   Cathode (-)      GND
 *  ------------------------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ==============================================================================
// 1. YOUR NETWORK CREDENTIALS & BACKEND SERVER URL
// ==============================================================================
// Enter your Wi-Fi Name (SSID) and Password below:
const char* WIFI_SSID     = "POCO C75 5G";
const char* WIFI_PASSWORD = "rajat123";

// Your computer's IP address on your Wi-Fi network (Port 5001):
const char* SERVER_URL    = "http://10.17.106.82:5001/api/flood/telemetry";

// Transmission interval (every 3000ms = 3 seconds)
const unsigned long TRANSMIT_INTERVAL_MS = 3000;

// ==============================================================================
// 2. PIN DEFINITIONS
// ==============================================================================
const int PIN_TRIG      = 5;
const int PIN_ECHO      = 18;
const int PIN_DHT       = 4;
const int PIN_SOIL      = 34;
const int PIN_LED_RED   = 19;
const int PIN_LED_GREEN = 22;

const float SOUND_SPEED         = 0.0343; // cm/us in ambient air
const unsigned long ECHO_TIMEOUT = 30000;  // 30ms timeout (~5.1 meters max)

// Soil moisture calibration range (approximate for capacitive v1.2)
const int DRY_ADC_VALUE = 3300; // Sensor in dry air
const int WET_ADC_VALUE = 1600; // Sensor submerged in water

unsigned long readingCount = 0;

// ==============================================================================
// 3. ZERO-DEPENDENCY DIRECT DHT11 READER
// ==============================================================================
struct DHTData {
  float temperature;
  float humidity;
  bool isValid;
};

DHTData readDHT11Direct(int pin) {
  uint8_t data[5] = {0, 0, 0, 0, 0};
  DHTData result = {0.0, 0.0, false};

  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delay(20);
  digitalWrite(pin, HIGH);
  delayMicroseconds(30);
  pinMode(pin, INPUT_PULLUP);

  unsigned long timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result;
  }
  timeout = micros();
  while (digitalRead(pin) == LOW) {
    if (micros() - timeout > 100) return result;
  }
  timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result;
  }

  for (int i = 0; i < 40; i++) {
    timeout = micros();
    while (digitalRead(pin) == LOW) {
      if (micros() - timeout > 100) return result;
    }
    unsigned long startHigh = micros();
    while (digitalRead(pin) == HIGH) {
      if (micros() - startHigh > 100) return result;
    }
    unsigned long duration = micros() - startHigh;
    int byteIndex = i / 8;
    data[byteIndex] <<= 1;
    if (duration > 40) {
      data[byteIndex] |= 1;
    }
  }

  uint8_t checksum = (data[0] + data[1] + data[2] + data[3]) & 0xFF;
  if (checksum == data[4] && (data[0] != 0 || data[2] != 0)) {
    result.humidity    = (float)data[0] + ((float)data[1] * 0.1);
    result.temperature = (float)data[2] + ((float)data[3] * 0.1);
    result.isValid     = true;
  }
  return result;
}

// ==============================================================================
// 4. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  digitalWrite(PIN_LED_RED, HIGH); // Red on while connecting
  digitalWrite(PIN_LED_GREEN, LOW);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  analogReadResolution(12);
  analogSetPinAttenuation(PIN_SOIL, ADC_11db);

  Serial.println("\n=======================================================");
  Serial.println("  DisasterSense -> STERN-X Live Web Transmitter        ");
  Serial.println("=======================================================");

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Target Server:    ");
    Serial.println(SERVER_URL);
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
  } else {
    Serial.println("\n[WiFi] Connection failed. Check SSID and password.");
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
  }
}

// ==============================================================================
// 5. MAIN LOOP
// ==============================================================================
void loop() {
  readingCount++;

  // 1. Read DHT11
  DHTData dht = readDHT11Direct(PIN_DHT);

  // 2. Read HC-SR04 Ultrasonic Distance
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long echoDuration = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT);
  float distanceCm = 0.0;
  bool ultrasonicValid = false;

  if (echoDuration > 0) {
    distanceCm = (echoDuration * SOUND_SPEED) / 2.0;
    if (distanceCm >= 2.0 && distanceCm <= 400.0) {
      ultrasonicValid = true;
    }
  }

  // 3. Read Soil Moisture (Average 10 samples)
  long adcSum = 0;
  for (int i = 0; i < 10; i++) {
    adcSum += analogRead(PIN_SOIL);
    delay(5);
  }
  int rawSoilAdc = adcSum / 10;
  
  // Convert to approximate percentage (0% = dry air, 100% = water)
  int moisturePct = map(rawSoilAdc, DRY_ADC_VALUE, WET_ADC_VALUE, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);

  // 4. Print Local Reading
  Serial.print("[#");
  Serial.print(readingCount);
  Serial.print("] Distance: ");
  Serial.print(distanceCm, 1);
  Serial.print(" cm | Temp: ");
  Serial.print(dht.temperature, 1);
  Serial.print(" °C | Hum: ");
  Serial.print(dht.humidity, 1);
  Serial.print(" % | Soil: ");
  Serial.print(moisturePct);
  Serial.println("%");

  // 5. Transmit to STERN-X Backend via HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Construct JSON Payload for STERN-X Ingestion
    String jsonPayload = "{";
    if (ultrasonicValid) {
      jsonPayload += "\"water_surface_distance_cm\":" + String(distanceCm, 1) + ",";
    } else {
      jsonPayload += "\"water_surface_distance_cm\":null,";
    }
    if (dht.isValid) {
      jsonPayload += "\"temperature_c\":" + String(dht.temperature, 1) + ",";
      jsonPayload += "\"humidity_pct\":" + String(dht.humidity, 1) + ",";
    }
    jsonPayload += "\"soil_moisture_pct\":" + String(moisturePct) + ",";
    jsonPayload += "\"data_source\":\"HARDWARE_LIVE\",";
    jsonPayload += "\"is_valid\":" + String(ultrasonicValid ? "true" : "false");
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.print("  -> [HTTP POST] SUCCESS (");
      Serial.print(httpResponseCode);
      Serial.println(") Telemetry synced to website live!");
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
    } else {
      Serial.print("  -> [HTTP POST] ERROR Code: ");
      Serial.println(httpResponseCode);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
    }

    http.end();
  } else {
    Serial.println("  -> [WiFi] Disconnected! Attempting to reconnect...");
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    WiFi.reconnect();
  }

  delay(TRANSMIT_INTERVAL_MS);
}
