/*
 * DisasterSense - Test 2: HC-SR04 Ultrasonic Distance Sensor
 * 
 * Pin Connections:
 *   VCC  -> ESP32 5V / VIN rail (needs 5V from USB)
 *   GND  -> Common Ground rail
 *   TRIG -> ESP32 GPIO 5
 *   ECHO -> ESP32 GPIO 18 THROUGH 1k / 2k VOLTAGE DIVIDER:
 *           HC-SR04 ECHO -> 1k ohm -> [JUNCTION: GPIO 18 & 2k ohm] -> 2k ohm -> GND
 *
 * Description:
 *   Sends a 10 microsecond trigger pulse and reads the returning echo pulse.
 *   Uses a 30,000 microsecond timeout (~5.1 meters) to prevent the CPU from
 *   blocking indefinitely if no obstacle is detected or if a wire is loose.
 */

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// Speed of sound in ambient air: ~0.0343 cm/microsecond
const float SOUND_SPEED = 0.0343;

// Max echo timeout (30,000 us ~= 5.1 meters maximum distance)
const unsigned long ECHO_TIMEOUT_US = 30000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=========================================");
  Serial.println("DisasterSense: HC-SR04 Ultrasonic Test");
  Serial.println("=========================================");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Set TRIG low initially
  digitalWrite(TRIG_PIN, LOW);
  delay(50);
}

void loop() {
  // 1. Generate clean 10-microsecond trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 2. Measure ECHO pulse duration with explicit timeout
  unsigned long durationUs = pulseIn(ECHO_PIN, HIGH, ECHO_TIMEOUT_US);

  // 3. Process reading
  if (durationUs == 0) {
    Serial.println("[HC-SR04] ERROR: Echo timeout or sensor disconnected (No echo received)");
  } else {
    float distanceCm = (durationUs * SOUND_SPEED) / 2.0;

    // Filter valid HC-SR04 physical operating range (2 cm to 400 cm)
    if (distanceCm < 2.0 || distanceCm > 400.0) {
      Serial.print("[HC-SR04] WARNING: Out-of-range measurement: ");
      Serial.print(distanceCm, 1);
      Serial.println(" cm");
    } else {
      Serial.print("[HC-SR04] Distance: ");
      Serial.print(distanceCm, 1);
      Serial.print(" cm  |  Pulse duration: ");
      Serial.print(durationUs);
      Serial.println(" us");
    }
  }

  delay(1000); // Sample once per second
}
