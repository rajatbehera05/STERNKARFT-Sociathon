/*
 * ==============================================================================
 *  DisasterSense - Integrated All-Sensors Live Monitor (Zero-Dependency)
 * ==============================================================================
 *  Target Board: ESP32 DevKit / ESP32 Dev Module
 *  Serial Baud:  115200 baud
 *
 *  NO EXTERNAL LIBRARIES REQUIRED. Compiles directly on standard ESP32 core!
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
 *
 *  Buzzer                Both Pins        DISCONNECTED
 *  ------------------------------------------------------------------------------
 */

// ------------------------------------------------------------------------------
// Pin Definitions
// ------------------------------------------------------------------------------
const int PIN_TRIG      = 5;
const int PIN_ECHO      = 18;
const int PIN_DHT       = 4;
const int PIN_SOIL      = 34;
const int PIN_LED_RED   = 19;
const int PIN_LED_GREEN = 22;

// ------------------------------------------------------------------------------
// Configuration & Constants
// ------------------------------------------------------------------------------
const float SOUND_SPEED         = 0.0343; // cm per microsecond in ambient air
const unsigned long ECHO_TIMEOUT = 30000;  // 30ms timeout (~5.1 meters max)
const unsigned long LOOP_DELAY_MS = 2000;  // 2-second sampling interval

// Tabletop Flood / Distance Thresholds (adjust to match your setup height)
const float WARNING_DISTANCE_CM  = 15.0;  // Trigger warning if object is closer than 15 cm

// Sample counter
unsigned long readingCount = 0;

// ------------------------------------------------------------------------------
// Built-In Direct DHT11 Reader (No external library required)
// ------------------------------------------------------------------------------
struct DHTData {
  float temperature;
  float humidity;
  bool isValid;
};

DHTData readDHT11Direct(int pin) {
  uint8_t data[5] = {0, 0, 0, 0, 0};
  DHTData result = {0.0, 0.0, false};

  // 1. Host pulls pin low for 20ms to signal start
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delay(20);

  // 2. Host pulls pin high for 30 microseconds
  digitalWrite(pin, HIGH);
  delayMicroseconds(30);

  // 3. Switch to input and wait for sensor response
  pinMode(pin, INPUT_PULLUP);

  unsigned long timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result; // Sensor not responding
  }

  // Sensor response: 80us LOW followed by 80us HIGH
  timeout = micros();
  while (digitalRead(pin) == LOW) {
    if (micros() - timeout > 100) return result;
  }
  timeout = micros();
  while (digitalRead(pin) == HIGH) {
    if (micros() - timeout > 100) return result;
  }

  // 4. Read 40 bits (5 bytes: HumInt, HumDec, TempInt, TempDec, Checksum)
  for (int i = 0; i < 40; i++) {
    // Wait for the 50us low pulse to finish
    timeout = micros();
    while (digitalRead(pin) == LOW) {
      if (micros() - timeout > 100) return result;
    }

    // Measure the high pulse duration
    unsigned long startHigh = micros();
    while (digitalRead(pin) == HIGH) {
      if (micros() - startHigh > 100) return result;
    }
    unsigned long duration = micros() - startHigh;

    // In DHT11 protocol: pulse > 40us = bit 1, pulse < 40us = bit 0
    int byteIndex = i / 8;
    data[byteIndex] <<= 1;
    if (duration > 40) {
      data[byteIndex] |= 1;
    }
  }

  // 5. Verify 8-bit checksum
  uint8_t checksum = (data[0] + data[1] + data[2] + data[3]) & 0xFF;
  if (checksum == data[4] && (data[0] != 0 || data[2] != 0)) {
    result.humidity    = (float)data[0] + ((float)data[1] * 0.1);
    result.temperature = (float)data[2] + ((float)data[3] * 0.1);
    result.isValid     = true;
  }

  return result;
}

// ------------------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1500); // Allow serial monitor to open

  // Configure LED pins
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);

  // Configure Ultrasonic pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  // Configure Soil Moisture ADC
  analogReadResolution(12); // 12-bit (0 - 4095)
  analogSetPinAttenuation(PIN_SOIL, ADC_11db); // Full scale up to ~3.3V

  // Initial LED self-test: flash both LEDs
  digitalWrite(PIN_LED_RED, HIGH);
  digitalWrite(PIN_LED_GREEN, HIGH);
  delay(300);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);

  Serial.println("\n");
  Serial.println("==========================================================================");
  Serial.println("             DISASTERSENSE - ALL SENSORS LIVE TELEMETRY                   ");
  Serial.println("==========================================================================");
  Serial.println(" Baud Rate : 115200 baud");
  Serial.println(" Refresh   : Every 2.0 seconds");
  Serial.println(" Pins      : TRIG=5, ECHO=18, DHT=4, SOIL=34, RED_LED=19, GREEN_LED=22");
  Serial.println(" Mode      : Direct Bit-Banged DHT11 (Zero External Libraries Required)");
  Serial.println("==========================================================================\n");
}

// ------------------------------------------------------------------------------
// Main Loop
// ------------------------------------------------------------------------------
void loop() {
  readingCount++;

  // 1. Read DHT11 Temperature & Relative Humidity (Direct, no library needed)
  DHTData dht = readDHT11Direct(PIN_DHT);

  // 2. Read HC-SR04 Ultrasonic Distance (with non-blocking timeout)
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long echoDuration = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT);
  float distanceCm = 0.0;
  bool ultrasonicValid = false;
  String ultrasonicStatus = "";

  if (echoDuration == 0) {
    ultrasonicStatus = "TIMEOUT / NO ECHO";
  } else {
    distanceCm = (echoDuration * SOUND_SPEED) / 2.0;
    if (distanceCm < 2.0 || distanceCm > 400.0) {
      ultrasonicStatus = "OUT OF RANGE";
    } else {
      ultrasonicValid = true;
      ultrasonicStatus = "VALID";
    }
  }

  // 3. Read Capacitive Soil Moisture Sensor (10-Sample Averaging)
  long adcSum = 0;
  for (int i = 0; i < 10; i++) {
    adcSum += analogRead(PIN_SOIL);
    delay(5);
  }
  int rawSoilAdc = adcSum / 10;
  float soilVoltage = (rawSoilAdc / 4095.0) * 3.3;

  String soilState = "";
  if (rawSoilAdc > 3200) {
    soilState = "DRY / AIR (0-15%)";
  } else if (rawSoilAdc < 1800) {
    soilState = "SATURATED / WATER (70-100%)";
  } else {
    soilState = "MOIST / DAMP (20-65%)";
  }

  // 4. Overall Health & Alert Logic
  bool sensorFault = (!dht.isValid) || (!ultrasonicValid);
  bool floodRiskAlert = (ultrasonicValid && (distanceCm <= WARNING_DISTANCE_CM));

  if (sensorFault || floodRiskAlert) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
  } else {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
  }

  // 5. Formatted Dashboard Print
  Serial.print("[#");
  Serial.print(readingCount);
  Serial.println("] ----------------------------------------------------------------------");

  // Environmental Row
  Serial.print("  [ENV DHT11]     : ");
  if (dht.isValid) {
    Serial.print("Temperature = ");
    Serial.print(dht.temperature, 1);
    Serial.print(" °C  |  Humidity = ");
    Serial.print(dht.humidity, 1);
    Serial.println(" % RH  (OK)");
  } else {
    Serial.println("FAILED TO READ (Check 3.3V power and GPIO 4 wiring)");
  }

  // Ultrasonic Distance Row
  Serial.print("  [WATER LEVEL]   : ");
  if (ultrasonicValid) {
    Serial.print("Distance = ");
    Serial.print(distanceCm, 1);
    Serial.print(" cm  (Pulse: ");
    Serial.print(echoDuration);
    Serial.print(" us)  ");
    if (floodRiskAlert) {
      Serial.println("[!! WATER LEVEL WARNING !!]");
    } else {
      Serial.println("(NORMAL)");
    }
  } else {
    Serial.print("ERROR: ");
    Serial.println(ultrasonicStatus);
  }

  // Soil Moisture Row
  Serial.print("  [SOIL MOISTURE] : ");
  Serial.print("Raw ADC = ");
  Serial.print(rawSoilAdc);
  Serial.print(" / 4095  |  Voltage = ");
  Serial.print(soilVoltage, 2);
  Serial.print(" V  -> ");
  Serial.println(soilState);

  // Status & LED Row
  Serial.print("  [STATUS & LED]  : ");
  if (sensorFault) {
    Serial.println("RED LED ON  [SENSOR FAULT DETECTED]");
  } else if (floodRiskAlert) {
    Serial.println("RED LED ON  [RISK THRESHOLD BREACHED]");
  } else {
    Serial.println("GREEN LED ON [ALL SENSORS NORMAL & HEALTHY]");
  }
  Serial.println();

  delay(LOOP_DELAY_MS);
}
