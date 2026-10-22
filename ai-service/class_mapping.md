# Đối chiếu lớp AI nhận diện <-> mã vật tư demo

Sinh tự động bởi `backend/prisma/seed-demo.js` — mỗi dòng là 1 trong 61 lớp mà
AI Service (`GET /classes`) trả về, đối chiếu với đúng 1 vật tư demo tương ứng
(đã xác nhận khớp 100% với danh sách lớp thật của model đang chạy).

| Lớp AI | Mã vật tư | Tên vật tư |
|---|---|---|
| 1-5-Volt-Battery | PWR-001 | Pin AA 1.5V |
| 3-3-Volt-Battery | PWR-002 | Pin cúc áo 3.3V (CR-series) |
| 7-Segment-Display | DIS-001 | Màn hình LED 7 đoạn (1 số) |
| 9-Volt-Battery | PWR-003 | Pin vuông 9V |
| Arduino-Mega | MCU-001 | Board Arduino Mega 2560 |
| Arduino-Nano | MCU-002 | Board Arduino Nano |
| Arduino-Uno | MCU-003 | Board Arduino Uno R3 |
| BJT-Transistor | BJT-001 | Transistor BJT NPN 2N2222 |
| Bluetooth-Module | MOD-001 | Module Bluetooth HC-05 |
| Breadboard | ACC-001 | Breadboard 830 lỗ |
| Bridge-Rectifier | DIO-002 | Cầu diode chỉnh lưu KBP206 |
| Buck-Converter | MOD-002 | Module hạ áp DC-DC Buck Converter |
| Buzzer | DIS-002 | Còi buzzer 5V |
| Capacitor-10mf | CAP-001 | Tụ hóa 10µF 25V |
| Capacitor-470mf | CAP-002 | Tụ hóa 470µF 25V |
| DC-Motor | MOT-001 | Động cơ DC giảm tốc 3-6V |
| Diode | DIO-001 | Diode chỉnh lưu 1N4007 |
| ESP32 | MCU-004 | Board ESP32 DevKit V1 |
| ESP32-CAM | MCU-005 | Board ESP32-CAM |
| Film-Capacitor | CAP-003 | Tụ màng polyester 104 (100nF) |
| FT-232-USB-Serial-Module | MOD-003 | Module chuyển USB-UART FT232 |
| Fuse | ACC-002 | Cầu chì ống thủy tinh 5x20mm 1A |
| Fuse-Base | ACC-003 | Đế cầu chì 5x20mm (gắn PCB) |
| Gas-Sensor | SEN-001 | Cảm biến khí gas MQ-2 |
| GSM-Module | MOD-004 | Module GSM SIM800L |
| Heat-Sink | ACC-004 | Tản nhiệt nhôm TO-220 |
| High-Voltage-Ceramic-Capacitor | CAP-004 | Tụ gốm cao áp 2.2nF 2kV |
| Humidity-Sensor | SEN-002 | Cảm biến nhiệt độ - độ ẩm DHT22 |
| IC-Base-14-Pin | ACC-005 | Đế IC 14 chân (DIP-14) |
| IC-Base-28-Pin | ACC-006 | Đế IC 28 chân (DIP-28) |
| IC-Chip | IC-001 | IC số CD4017 (đếm thập phân) |
| IGBT | IGB-001 | IGBT công suất IRG4BC30 |
| Inductor | IND-001 | Cuộn cảm 100µH |
| IR-Sensor | SEN-003 | Cảm biến hồng ngoại thu phát IR |
| Keypad | SW-001 | Bàn phím ma trận 4x4 |
| LCD-Display | DIS-003 | Màn hình LCD 16x2 (kèm I2C) |
| LDR-Sensor | SEN-004 | Cảm biến quang trở LDR (quang trở + module) |
| LED-Light | DIS-004 | LED đơn 5mm màu đỏ |
| Low-Voltage-Ceramic-Capacitor | CAP-005 | Tụ gốm hạ áp 104 (100nF) 50V |
| MLC-Capacitor | CAP-006 | Tụ MLCC 1µF 0805 |
| MOSFET | MOS-001 | MOSFET kênh N IRF540 |
| Motion-Sensor | SEN-005 | Cảm biến chuyển động PIR HC-SR501 |
| Motor-Driver | MOD-005 | Module điều khiển động cơ L298N |
| NTC-Thermistor | SEN-006 | Điện trở nhiệt NTC 10kΩ |
| OLED-Display | DIS-005 | Màn hình OLED 0.96 inch (I2C) |
| Pin-Header | ACC-007 | Header chân cắm thẳng 40 chân (2.54mm) |
| Push-Switch | SW-002 | Nút nhấn (push button) 12mm |
| Raindrops-Module | SEN-007 | Module cảm biến mưa (Rain Sensor) |
| Relay-Module | MOD-007 | Module rơ-le 1 kênh 5V |
| Resistor | RES-001 | Điện trở than 220Ω 1/4W |
| RFID-Scanner | MOD-006 | Module đọc thẻ RFID RC522 |
| Rocker-Switch | SW-003 | Công tắc bập bênh (rocker switch) |
| Servo-Motor | MOT-002 | Động cơ servo SG90 |
| Soil-Moisture-Sensor | SEN-008 | Cảm biến độ ẩm đất (Soil Moisture) |
| Sonar-Sensor | SEN-009 | Cảm biến siêu âm HC-SR04 |
| Tact-Switch | SW-004 | Nút nhấn tact switch 6x6mm |
| Taper-Potentiometer | POT-001 | Biến trở tuyến tính 10kΩ (núm xoay) |
| TCRT5000 | SEN-010 | Cảm biến dò line hồng ngoại TCRT5000 |
| Trimmer-Potentiometer | POT-002 | Biến trở tinh chỉnh (trimmer) 10kΩ |
| Water-Sensor | SEN-011 | Cảm biến mực nước (Water Sensor) |
| Zener-Diode | DIO-003 | Diode Zener 5.1V 1W |

Tổng: 61/61 lớp có vật tư demo đại diện.
