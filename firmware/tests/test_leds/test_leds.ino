/*
 * DisasterSense - Test 1: Red and Green LEDs
 * 
 * Pin Connections:
 *   Red LED   -> Anode (+) to GPIO 19 via 330 ohm resistor, Cathode (-) to Common GND
 *   Green LED -> Anode (+) to GPIO 22 via 330 ohm resistor, Cathode (-) to Common GND
 *
 * Description:
 *   Tests the two status indicator LEDs independently to verify GPIO output drive
 *   and resistor connections before connecting sensor logic.
 */

const int RED_LED_PIN = 19;
const int GREEN_LED_PIN = 22;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=========================================");
  Serial.println("DisasterSense: LED Verification Test");
  Serial.println("=========================================");

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);

  // Initial state: both LEDs OFF
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);
}

void loop() {
  // 1. Green LED ON, Red LED OFF (Simulates Normal Status)
  Serial.println("[STATUS] Green LED ON (Normal), Red LED OFF");
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);
  delay(2000);

  // 2. Red LED ON, Green LED OFF (Simulates Warning/Fault Status)
  Serial.println("[STATUS] Red LED ON (Warning), Green LED OFF");
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);
  delay(2000);

  // 3. Both LEDs OFF
  Serial.println("[STATUS] Both LEDs OFF");
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  delay(1000);
}
