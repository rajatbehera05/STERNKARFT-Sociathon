# DisasterSense — ESP32 Firmware & Hardware Testing Suite

This directory contains the firmware code and testing suite for the **DisasterSense** hardware prototype (ESP32 DevKit + HC-SR04 + DHT11 + Capacitive Soil Moisture + Status LEDs).

---

## 1. Pin-Mapping Reference

| Component | Pin | ESP32 Connection / Rail | Description |
|---|---|---|---|
| **HC-SR04** | VCC | **5V / VIN** | Powered from USB 5V rail |
| **HC-SR04** | GND | **GND** | Common ground rail |
| **HC-SR04** | TRIG | **GPIO 5** | 3.3V trigger output from ESP32 |
| **HC-SR04** | ECHO | **GPIO 18 (via divider)** | **Requires 1kΩ / 2kΩ voltage divider** |
| **DHT11 (3-pin)** | VCC | **3V3** | Powered from ESP32 3.3V rail |
| **DHT11 (3-pin)** | GND | **GND** | Common ground rail |
| **DHT11 (3-pin)** | DATA / S | **GPIO 4** | Digital sensor data pin |
| **Soil Moisture** | VCC | **3V3** | Powered from ESP32 3.3V rail |
| **Soil Moisture** | GND | **GND** | Common ground rail |
| **Soil Moisture** | AO / AOUT | **GPIO 34** | ADC1 Channel 6 (Analog-only input) |
| **Red LED** | Anode (+) | **GPIO 19 (via 330Ω)** | Fault / Warning indicator |
| **Red LED** | Cathode (−)| **GND** | Common ground rail |
| **Green LED** | Anode (+) | **GPIO 22 (via 330Ω)** | Normal status indicator |
| **Green LED** | Cathode (−)| **GND** | Common ground rail |
| **Buzzer** | Pins 1 & 2 | **DISCONNECTED** | Left disconnected until polarity & rating verified |

---

## 2. Voltage Divider Wiring (HC-SR04 ECHO)

The HC-SR04 outputs a 5V echo pulse. ESP32 pins are rated for 3.3V maximum. The voltage divider steps down the 5V signal to ~3.3V safely:

```
HC-SR04 ECHO pin ───[ 1 kΩ Resistor ]───┬───> ESP32 GPIO 18
                                        │
                                  [ 2 kΩ Resistor ]
                                        │
                                       GND
```

*Note: Connect GPIO 18 to the middle junction between the 1kΩ and 2kΩ resistors. Never connect GPIO 18 directly to the ECHO pin.*

---

## 3. Directory Structure

```
firmware/
├── README.md                                          # This documentation
├── all_sensors_monitor/
│   └── all_sensors_monitor.ino                        # ⭐ Live Multi-Sensor Dashboard (All Readings via Serial)
├── wifi_live_telemetry/
│   └── wifi_live_telemetry.ino                        # 🌐 Wi-Fi Transmitter (Streams directly to web dashboard)
└── tests/
    ├── test_leds/
    │   └── test_leds.ino                              # Test 1: Red & Green LEDs
    ├── test_ultrasonic/
    │   └── test_ultrasonic.ino                        # Test 2: HC-SR04 with echo timeout
    ├── test_dht11/
    │   └── test_dht11.ino                             # Test 3: DHT11 Temp & Humidity
    ├── test_soil_moisture/
    │   └── test_soil_moisture.ino                     # Test 4: Capacitive Soil Moisture ADC
    └── sensor_diagnostic_suite/
        └── sensor_diagnostic_suite.ino                # Diagnostic runner
```

---

## 4. Testing Procedure (Step-by-Step)

### Step 1: Pre-Power Inspection (USB Unplugged)
1. Verify 3.3V and 5V power rails on the breadboard are separate and not bridged.
2. Verify all components share the same ground (GND) rail.
3. Verify both LEDs have their 330Ω series resistors on their anode (+) long legs.
4. Verify the voltage divider is installed on ECHO, and GPIO 18 connects to the junction.
5. Verify the buzzer is disconnected.

### Step 2: Open in Arduino IDE
1. Open Arduino IDE.
2. Select Board: **Tools → Board → ESP32 Arduino → ESP32 Dev Module**.
3. Select Port: **Tools → Port → COMx** (the port of your ESP32).
4. Install DHT library:
   - Go to **Sketch → Include Library → Manage Libraries...**
   - Search for `DHT sensor library` by **Adafruit**.
   - Click **Install** (and choose **Install All** for dependencies).

### Step 3: Run Tests in Order
1. **LEDs:** Open [`tests/test_leds/test_leds.ino`](./tests/test_leds/test_leds.ino) and upload. Watch the LEDs alternate.
2. **Ultrasonic:** Open [`tests/test_ultrasonic/test_ultrasonic.ino`](./tests/test_ultrasonic/test_ultrasonic.ino) and upload. Open Serial Monitor at **115200 baud**. Move an object in front of the sensor to verify distance changes.
3. **DHT11:** Open [`tests/test_dht11/test_dht11.ino`](./tests/test_dht11/test_dht11.ino) and upload. Confirm temperature and humidity readings appear in the Serial Monitor.
4. **Soil Moisture:** Open [`tests/test_soil_moisture/test_soil_moisture.ino`](./tests/test_soil_moisture/test_soil_moisture.ino) and upload. Observe raw ADC values in air vs touching a damp cloth.
5. **Combined Diagnostic:** Open [`tests/sensor_diagnostic_suite/sensor_diagnostic_suite.ino`](./tests/sensor_diagnostic_suite/sensor_diagnostic_suite.ino) to run the full Phase 2 diagnostic suite.
