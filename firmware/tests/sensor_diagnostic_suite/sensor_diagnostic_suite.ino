/*
 * DisasterSense - Phase 2: Sensor Diagnostic & Telemetry Suite
 * 
 * Target Board: ESP32 Dev Module / DevKit WROOM-32
 * Baud Rate:    115200 baud
 *
 * Pin Map:
 *   - HC-SR04 TRIG: GPIO 5 (Output)
 *   - HC-SR04 ECHO: GPIO 18 (Input via 1k/2k voltage divider)
 *   - DHT11 DATA:   GPIO 4 (Bidirectional via DHT library)
 *   - Soil Sensor:  GPIO 34 (ADC1 Analog Input)
 *   - Red LED:      GPIO 19 (Output via 330 ohm)
 *   - Green LED:    GPIO 22 (Output via 330 ohm)
 *   - Buzzer:       DISCONNECTED
 *
 * Requirements:
 *   Install 'DHT sensor library' by Adafruit in Arduino IDE.
 */

#include "DHT.h"

// Pin Definitions
const int PIN_TRIG      = 5;
const int PIN_ECHO      = 18;
const int PIN_DHT       = 4;
const int PIN_SOIL      = 34;
const int PIN_RED_LED   = 19;
const int PIN_GREEN_LED = 22;

#define DHTTYPE DHT11
DHT dht(PIN_DHT, DHTTYPE);

// Physical Constants
const float SOUND_SPEED = 0.0343; // cm/microsecond in ambient air
const unsigned long ECHO_TIMEOUT_US = 30000; // ~5.1m max timeout

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  DisasterSense - ESP32 Hardware Diagnostic Suite    ");
  Serial.println("=======================================================");

  // Initialize LEDs
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);

  // Initialize Ultrasonic Pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  // Initialize ADC for Soil Sensor
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_SOIL, ADC_11db);

  // Initialize DHT11
  dht.begin();

  // Startup LED Indicator: Flash both LEDs twice to confirm power & GPIO
  for (int i = 0; i < 2; i++) {
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_GREEN_LED, HIGH);
    delay(200);
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_GREEN_LED, LOW);
    delay(200);
  }

  Serial.println("Diagnostics initialized. Reading sensors every 2.5s...\n");
}

void loop() {
  // 1. Read DHT11 Temperature & Humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  bool dhtValid = !(isnan(humidity) || isnan(temperature));

  // 2. Read HC-SR04 Ultrasonic Distance
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long durationUs = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
  float distanceCm = -1.0;
  bool ultrasonicValid = false;

  if (durationUs > 0) {
    distanceCm = (durationUs * SOUND_SPEED) / 2.0;
    if (distanceCm >= 2.0 && distanceCm <= 400.0) {
      ultrasonicValid = true;
    }
  }

  // 3. Read Capacitive Soil Moisture Sensor (Average of 10 samples)
  long soilSum = 0;
  for (int i = 0; i < 10; i++) {
    soilSum += analogRead(PIN_SOIL);
    delay(5);
  }
  int rawSoilAdc = soilSum / 10;
  float soilVolts = (rawSoilAdc / 4095.0) * 3.3;

  // 4. Determine System Status & LED State
  bool allSensorsHealthy = dhtValid && ultrasonicValid;
  if (allSensorsHealthy) {
    digitalWrite(PIN_GREEN_LED, HIGH);
    digitalWrite(PIN_RED_LED, LOW);
  } else {
    // If any sensor fails, light Red LED
    digitalWrite(PIN_GREEN_LED, LOW);
    digitalWrite(PIN_RED_LED, HIGH);
  }

  // 5. Formatted Diagnostic Output to Serial Monitor (115200 baud)
  Serial.println("--------------------------------------------------------------------------------");
  Serial.print("[DHT11]  Temp: ");
  if (dhtValid) {
    Serial.print(temperature, 1);
    Serial.print(" °C | Humidity: ");
    Serial.print(humidity, 1);
    Serial.println(" % RH");
  } else {
    Serial.println("ERROR (Check GPIO 4 wiring/power)");
  }

  Serial.print("[HC-SR04] Distance: ");
  if (ultrasonicValid) {
    Serial.print(distanceCm, 1);
    Serial.println(" cm");
  } else if (durationUs == 0) {
    Serial.println("TIMEOUT (No echo received)");
  } else {
    Serial.print("OUT OF RANGE (");
    Serial.print(distanceCm, 1);
    Serial.println(" cm)");
  }

  Serial.print("[SOIL]   Raw ADC: ");
  Serial.print(rawSoilAdc);
  Serial.print(" (");
  Serial.print(soilVolts, 2);
  Serial.print(" V) | Status: ");
  if (rawSoilAdc > 3200) {
    Serial.println("DRY / IN AIR");
  } else if (rawSoilAdc < 1800) {
    Serial.println("SATURATED / WET");
  } else {
    Serial.println("DAMP / MOIST");
  }

  Serial.print("[SYSTEM] Node State: ");
  Serial.println(allSensorsHealthy ? "OK (Green LED ON)" : "SENSOR FAULT (Red LED ON)");

  delay(2500); // 2.5 second diagnostic cycle
}
