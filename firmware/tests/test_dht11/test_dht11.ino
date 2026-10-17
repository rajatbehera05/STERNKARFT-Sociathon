/*
 * DisasterSense - Test 3: DHT11 Temperature & Humidity Sensor
 * 
 * Pin Connections:
 *   VCC    -> ESP32 3V3 rail
 *   GND    -> Common Ground rail
 *   DATA/S -> ESP32 GPIO 4
 *
 * Requirements:
 *   Install 'DHT sensor library' by Adafruit via Arduino IDE Library Manager.
 *   (Also installs required 'Adafruit Unified Sensor' dependency).
 *
 * Description:
 *   Reads temperature (Celsius) and relative humidity (%) every 2.5 seconds.
 *   Reports explicit errors when sensor communications fail.
 */

#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=========================================");
  Serial.println("DisasterSense: DHT11 Environment Test");
  Serial.println("=========================================");

  dht.begin();
}

void loop() {
  // DHT11 requires at least 2.0 seconds between consecutive samples
  delay(2500);

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Degrees Celsius

  // Check if any reading failed (returns NaN if disconnected or timed out)
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[DHT11] ERROR: Failed to read from sensor. Check 3.3V power, GND, and GPIO 4 data pin.");
    return;
  }

  Serial.print("[DHT11] Temperature: ");
  Serial.print(temperature, 1);
  Serial.print(" °C  |  Relative Humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" % RH");
}
