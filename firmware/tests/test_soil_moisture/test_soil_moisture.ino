/*
 * DisasterSense - Test 4: Capacitive Soil Moisture Sensor
 * 
 * Pin Connections:
 *   VCC     -> ESP32 3V3 rail
 *   GND     -> Common Ground rail
 *   AO/AOUT -> ESP32 GPIO 34 (ADC1 Channel 6, Input-only)
 *
 * Description:
 *   Reads the analog output voltage from the capacitive soil moisture sensor.
 *   Uses 12-bit ADC resolution (0 to 4095) with 11 dB attenuation (measuring 0 to ~3.3V).
 *   Averages 10 consecutive readings to filter out electrical noise.
 */

const int SOIL_PIN = 34;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=========================================");
  Serial.println("DisasterSense: Soil Moisture Sensor Test");
  Serial.println("=========================================");

  // Set 12-bit ADC resolution (range 0 - 4095)
  analogReadResolution(12);

  // Set 11dB attenuation to allow measuring up to ~3.3V full scale
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
}

void loop() {
  // Take 10 samples and compute running average to eliminate noise
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SOIL_PIN);
    delay(10);
  }
  int rawAdc = sum / 10;

  // Approximate voltage conversion (3.3V reference / 4095 max ADC)
  float approxVoltage = (rawAdc / 4095.0) * 3.3;

  Serial.print("[SOIL SENSOR] Raw ADC: ");
  Serial.print(rawAdc);
  Serial.print(" / 4095  |  Approx Voltage: ");
  Serial.print(approxVoltage, 2);
  Serial.print(" V");

  // Qualitative baseline indicators for tabletop testing
  if (rawAdc > 3200) {
    Serial.println("  -> [DRY / SENSOR IN AIR]");
  } else if (rawAdc < 1800) {
    Serial.println("  -> [SATURATED / SENSOR IN WATER]");
  } else {
    Serial.println("  -> [DAMP / MOIST SUBSTRATE]");
  }

  delay(1500); // Sample every 1.5 seconds
}
