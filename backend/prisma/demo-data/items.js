// 71 vật tư demo. `category` = tên danh mục lá (hoặc tên danh mục gốc nếu gốc
// đó không có con — xem categories.js). `warehouse` = kho "nhà" nơi vật tư
// được nhập về đầu tiên ('WH1'|'WH2'|'WH3', khớp key trong warehouses.js).
// `ai_class` = đúng tên lớp mà AI Service (GET /classes) trả về — dùng để
// sinh ai-service/class_mapping.md; `null` nghĩa là vật tư thêm cho đa dạng,
// không đại diện riêng cho 1 lớp AI nào (đã có vật tư khác cùng họ đại diện).

const PASSIVE = { min_stock: 50, max_stock: 500 };
const SEMI = { min_stock: 20, max_stock: 200 };
const MCU = { min_stock: 5, max_stock: 40 };
const MOD = { min_stock: 8, max_stock: 60 };
const SEN = { min_stock: 10, max_stock: 80 };
const DIS = { min_stock: 10, max_stock: 80 };
const MOT = { min_stock: 5, max_stock: 30 };
const SW = { min_stock: 30, max_stock: 300 };
const PWR = { min_stock: 15, max_stock: 150 };
const ACC = { min_stock: 15, max_stock: 150 };

module.exports = [
  // ── Linh kiện thụ động / Điện trở ──
  { code: 'RES-001', name: 'Điện trở than 220Ω 1/4W', category: 'Điện trở', unit: 'Cái', specs: '220Ω ±5%, 0.25W', ...PASSIVE, warehouse: 'WH1', ai_class: 'Resistor' },
  { code: 'RES-002', name: 'Điện trở than 1kΩ 1/4W', category: 'Điện trở', unit: 'Cái', specs: '1kΩ ±5%, 0.25W', ...PASSIVE, warehouse: 'WH1', ai_class: null },
  { code: 'RES-003', name: 'Điện trở than 10kΩ 1/4W', category: 'Điện trở', unit: 'Cái', specs: '10kΩ ±5%, 0.25W', ...PASSIVE, warehouse: 'WH1', ai_class: null },

  // ── Linh kiện thụ động / Tụ điện ──
  { code: 'CAP-001', name: 'Tụ hóa 10µF 25V', category: 'Tụ điện', unit: 'Cái', specs: '10µF, 25V, ±20%', ...PASSIVE, warehouse: 'WH1', ai_class: 'Capacitor-10mf' },
  { code: 'CAP-002', name: 'Tụ hóa 470µF 25V', category: 'Tụ điện', unit: 'Cái', specs: '470µF, 25V, ±20%', ...PASSIVE, warehouse: 'WH1', ai_class: 'Capacitor-470mf' },
  { code: 'CAP-003', name: 'Tụ màng polyester 104 (100nF)', category: 'Tụ điện', unit: 'Cái', specs: '100nF, 63V, film', ...PASSIVE, warehouse: 'WH1', ai_class: 'Film-Capacitor' },
  { code: 'CAP-004', name: 'Tụ gốm cao áp 2.2nF 2kV', category: 'Tụ điện', unit: 'Cái', specs: '2.2nF, 2000V, gốm', ...PASSIVE, warehouse: 'WH1', ai_class: 'High-Voltage-Ceramic-Capacitor' },
  { code: 'CAP-005', name: 'Tụ gốm hạ áp 104 (100nF) 50V', category: 'Tụ điện', unit: 'Cái', specs: '100nF, 50V, gốm', ...PASSIVE, warehouse: 'WH1', ai_class: 'Low-Voltage-Ceramic-Capacitor' },
  { code: 'CAP-006', name: 'Tụ MLCC 1µF 0805', category: 'Tụ điện', unit: 'Cái', specs: '1µF, 16V, nhiều lớp gốm, dán 0805', ...PASSIVE, warehouse: 'WH1', ai_class: 'MLC-Capacitor' },
  { code: 'CAP-007', name: 'Tụ gốm 104 (100nF) chân rời', category: 'Tụ điện', unit: 'Cái', specs: '100nF, 50V', ...PASSIVE, warehouse: 'WH1', ai_class: null },

  // ── Linh kiện thụ động / Cuộn cảm ──
  { code: 'IND-001', name: 'Cuộn cảm 100µH', category: 'Cuộn cảm', unit: 'Cái', specs: '100µH, dòng tối đa 1A', ...PASSIVE, warehouse: 'WH1', ai_class: 'Inductor' },

  // ── Linh kiện thụ động / Biến trở ──
  { code: 'POT-001', name: 'Biến trở tuyến tính 10kΩ (núm xoay)', category: 'Biến trở', unit: 'Cái', specs: '10kΩ, tuyến tính, có trục xoay', ...PASSIVE, warehouse: 'WH1', ai_class: 'Taper-Potentiometer' },
  { code: 'POT-002', name: 'Biến trở tinh chỉnh (trimmer) 10kΩ', category: 'Biến trở', unit: 'Cái', specs: '10kΩ, trimmer đứng, vặn vít', ...PASSIVE, warehouse: 'WH1', ai_class: 'Trimmer-Potentiometer' },

  // ── Linh kiện bán dẫn / Diode ──
  { code: 'DIO-001', name: 'Diode chỉnh lưu 1N4007', category: 'Diode', unit: 'Cái', specs: '1A, 1000V', ...SEMI, warehouse: 'WH1', ai_class: 'Diode' },
  { code: 'DIO-002', name: 'Cầu diode chỉnh lưu KBP206', category: 'Diode', unit: 'Cái', specs: '2A, 600V, cầu chỉnh lưu 4 chân', ...SEMI, warehouse: 'WH1', ai_class: 'Bridge-Rectifier' },
  { code: 'DIO-003', name: 'Diode Zener 5.1V 1W', category: 'Diode', unit: 'Cái', specs: '5.1V, 1W', ...SEMI, warehouse: 'WH1', ai_class: 'Zener-Diode' },

  // ── Linh kiện bán dẫn / Transistor BJT, MOSFET, IGBT, IC ──
  { code: 'BJT-001', name: 'Transistor BJT NPN 2N2222', category: 'Transistor BJT', unit: 'Cái', specs: 'NPN, 40V, 0.6A', ...SEMI, warehouse: 'WH1', ai_class: 'BJT-Transistor' },
  { code: 'MOS-001', name: 'MOSFET kênh N IRF540', category: 'MOSFET', unit: 'Cái', specs: 'N-channel, 100V, 28A', ...SEMI, warehouse: 'WH1', ai_class: 'MOSFET' },
  { code: 'IGB-001', name: 'IGBT công suất IRG4BC30', category: 'IGBT', unit: 'Cái', specs: '600V, 18A', ...SEMI, warehouse: 'WH1', ai_class: 'IGBT' },
  { code: 'IC-001', name: 'IC số CD4017 (đếm thập phân)', category: 'IC', unit: 'Cái', specs: 'DIP-16, CMOS', ...SEMI, warehouse: 'WH1', ai_class: 'IC-Chip' },

  // ── Vi điều khiển và board mạch ──
  { code: 'MCU-001', name: 'Board Arduino Mega 2560', category: 'Arduino', unit: 'Cái', specs: 'ATmega2560, 54 chân I/O số', ...MCU, warehouse: 'WH2', ai_class: 'Arduino-Mega' },
  { code: 'MCU-002', name: 'Board Arduino Nano', category: 'Arduino', unit: 'Cái', specs: 'ATmega328P, giao tiếp Mini-USB', ...MCU, warehouse: 'WH2', ai_class: 'Arduino-Nano' },
  { code: 'MCU-003', name: 'Board Arduino Uno R3', category: 'Arduino', unit: 'Cái', specs: 'ATmega328P, 14 chân I/O số', ...MCU, warehouse: 'WH2', ai_class: 'Arduino-Uno' },
  { code: 'MCU-004', name: 'Board ESP32 DevKit V1', category: 'ESP32', unit: 'Cái', specs: 'WiFi+Bluetooth, 38 chân', ...MCU, warehouse: 'WH2', ai_class: 'ESP32' },
  { code: 'MCU-005', name: 'Board ESP32-CAM', category: 'ESP32', unit: 'Cái', specs: 'ESP32 tích hợp camera OV2640', ...MCU, warehouse: 'WH2', ai_class: 'ESP32-CAM' },
  { code: 'BRD-001', name: 'Board mở rộng Sensor Shield V5', category: 'Board mở rộng', unit: 'Cái', specs: 'Gắn lên Arduino Uno, mở rộng chân cảm biến', ...MCU, warehouse: 'WH2', ai_class: null },

  // ── Module chức năng ──
  { code: 'MOD-001', name: 'Module Bluetooth HC-05', category: 'Module giao tiếp', unit: 'Cái', specs: 'UART, Bluetooth 2.0', ...MOD, warehouse: 'WH2', ai_class: 'Bluetooth-Module' },
  { code: 'MOD-002', name: 'Module hạ áp DC-DC Buck Converter', category: 'Module nguồn', unit: 'Cái', specs: 'Ngõ vào 4-40V, ngõ ra 1.25-37V', ...MOD, warehouse: 'WH2', ai_class: 'Buck-Converter' },
  { code: 'MOD-003', name: 'Module chuyển USB-UART FT232', category: 'Module giao tiếp', unit: 'Cái', specs: 'USB sang Serial TTL 3.3V/5V', ...MOD, warehouse: 'WH2', ai_class: 'FT-232-USB-Serial-Module' },
  { code: 'MOD-004', name: 'Module GSM SIM800L', category: 'Module giao tiếp', unit: 'Cái', specs: 'GSM/GPRS, hỗ trợ SIM 2G', ...MOD, warehouse: 'WH2', ai_class: 'GSM-Module' },
  { code: 'MOD-005', name: 'Module điều khiển động cơ L298N', category: 'Module điều khiển động cơ', unit: 'Cái', specs: 'Cầu H kép, 2A/kênh', ...MOD, warehouse: 'WH2', ai_class: 'Motor-Driver' },
  { code: 'MOD-006', name: 'Module đọc thẻ RFID RC522', category: 'Module giao tiếp', unit: 'Cái', specs: '13.56MHz, giao tiếp SPI', ...MOD, warehouse: 'WH2', ai_class: 'RFID-Scanner' },
  { code: 'MOD-007', name: 'Module rơ-le 1 kênh 5V', category: 'Module rơ-le', unit: 'Cái', specs: '5V, tải tối đa 10A/250VAC', ...MOD, warehouse: 'WH2', ai_class: 'Relay-Module' },
  { code: 'MOD-008', name: 'Module nguồn ổn áp LM2596', category: 'Module nguồn', unit: 'Cái', specs: 'Buck converter, có biến trở chỉnh áp ra', ...MOD, warehouse: 'WH2', ai_class: null },

  // ── Cảm biến ──
  { code: 'SEN-001', name: 'Cảm biến khí gas MQ-2', category: 'Cảm biến', unit: 'Cái', specs: 'Phát hiện gas/khói, ngõ ra analog+digital', ...SEN, warehouse: 'WH2', ai_class: 'Gas-Sensor' },
  { code: 'SEN-002', name: 'Cảm biến nhiệt độ - độ ẩm DHT22', category: 'Cảm biến', unit: 'Cái', specs: 'Độ ẩm 0-100%, nhiệt độ -40..80°C', ...SEN, warehouse: 'WH2', ai_class: 'Humidity-Sensor' },
  { code: 'SEN-003', name: 'Cảm biến hồng ngoại thu phát IR', category: 'Cảm biến', unit: 'Cái', specs: 'Phát hiện vật cản hồng ngoại', ...SEN, warehouse: 'WH2', ai_class: 'IR-Sensor' },
  { code: 'SEN-004', name: 'Cảm biến quang trở LDR (quang trở + module)', category: 'Cảm biến', unit: 'Cái', specs: 'Quang trở GL5528 + module so sánh', ...SEN, warehouse: 'WH2', ai_class: 'LDR-Sensor' },
  { code: 'SEN-005', name: 'Cảm biến chuyển động PIR HC-SR501', category: 'Cảm biến', unit: 'Cái', specs: 'Hồng ngoại thụ động, góc quét 120°', ...SEN, warehouse: 'WH2', ai_class: 'Motion-Sensor' },
  { code: 'SEN-006', name: 'Điện trở nhiệt NTC 10kΩ', category: 'Cảm biến', unit: 'Cái', specs: 'NTC 10kΩ @25°C, đo nhiệt độ', ...SEN, warehouse: 'WH2', ai_class: 'NTC-Thermistor' },
  { code: 'SEN-007', name: 'Module cảm biến mưa (Rain Sensor)', category: 'Cảm biến', unit: 'Cái', specs: 'Tấm cảm biến + module so sánh LM393', ...SEN, warehouse: 'WH2', ai_class: 'Raindrops-Module' },
  { code: 'SEN-008', name: 'Cảm biến độ ẩm đất (Soil Moisture)', category: 'Cảm biến', unit: 'Cái', specs: '2 chấu dò + module so sánh', ...SEN, warehouse: 'WH2', ai_class: 'Soil-Moisture-Sensor' },
  { code: 'SEN-009', name: 'Cảm biến siêu âm HC-SR04', category: 'Cảm biến', unit: 'Cái', specs: 'Đo khoảng cách 2-400cm', ...SEN, warehouse: 'WH2', ai_class: 'Sonar-Sensor' },
  { code: 'SEN-010', name: 'Cảm biến dò line hồng ngoại TCRT5000', category: 'Cảm biến', unit: 'Cái', specs: 'Phát hiện vạch line, khoảng cách ngắn', ...SEN, warehouse: 'WH2', ai_class: 'TCRT5000' },
  { code: 'SEN-011', name: 'Cảm biến mực nước (Water Sensor)', category: 'Cảm biến', unit: 'Cái', specs: 'Dò mức nước dạng mạch hở', ...SEN, warehouse: 'WH2', ai_class: 'Water-Sensor' },

  // ── Hiển thị ──
  { code: 'DIS-001', name: 'Màn hình LED 7 đoạn (1 số)', category: 'Hiển thị', unit: 'Cái', specs: '1 digit, Anode chung', ...DIS, warehouse: 'WH2', ai_class: '7-Segment-Display' },
  { code: 'DIS-002', name: 'Còi buzzer 5V', category: 'Hiển thị', unit: 'Cái', specs: '5V, buzzer có mạch dao động', ...DIS, warehouse: 'WH2', ai_class: 'Buzzer' },
  { code: 'DIS-003', name: 'Màn hình LCD 16x2 (kèm I2C)', category: 'Hiển thị', unit: 'Cái', specs: '16x2 ký tự, nền xanh, giao tiếp I2C', ...DIS, warehouse: 'WH2', ai_class: 'LCD-Display' },
  { code: 'DIS-004', name: 'LED đơn 5mm màu đỏ', category: 'Hiển thị', unit: 'Cái', specs: '5mm, 2V, 20mA, đỏ', ...DIS, warehouse: 'WH2', ai_class: 'LED-Light' },
  { code: 'DIS-005', name: 'Màn hình OLED 0.96 inch (I2C)', category: 'Hiển thị', unit: 'Cái', specs: '128x64, giao tiếp I2C', ...DIS, warehouse: 'WH2', ai_class: 'OLED-Display' },
  { code: 'DIS-006', name: 'LED đơn 5mm màu xanh lá', category: 'Hiển thị', unit: 'Cái', specs: '5mm, 2V, 20mA, xanh lá', ...DIS, warehouse: 'WH2', ai_class: null },
  { code: 'DIS-007', name: 'LED đơn 5mm màu vàng', category: 'Hiển thị', unit: 'Cái', specs: '5mm, 2V, 20mA, vàng', ...DIS, warehouse: 'WH2', ai_class: null },

  // ── Động cơ ──
  { code: 'MOT-001', name: 'Động cơ DC giảm tốc 3-6V', category: 'Động cơ', unit: 'Cái', specs: '3-6V, kèm bánh xe cao su', ...MOT, warehouse: 'WH3', ai_class: 'DC-Motor' },
  { code: 'MOT-002', name: 'Động cơ servo SG90', category: 'Động cơ', unit: 'Cái', specs: '9g, góc quay 180°', ...MOT, warehouse: 'WH3', ai_class: 'Servo-Motor' },

  // ── Công tắc và nút bấm ──
  { code: 'SW-001', name: 'Bàn phím ma trận 4x4', category: 'Công tắc và nút bấm', unit: 'Cái', specs: '16 phím, dạng màng', ...SW, warehouse: 'WH3', ai_class: 'Keypad' },
  { code: 'SW-002', name: 'Nút nhấn (push button) 12mm', category: 'Công tắc và nút bấm', unit: 'Cái', specs: '12mm, 2 chân, thường hở', ...SW, warehouse: 'WH3', ai_class: 'Push-Switch' },
  { code: 'SW-003', name: 'Công tắc bập bênh (rocker switch)', category: 'Công tắc và nút bấm', unit: 'Cái', specs: '2 vị trí ON-OFF, 6A/250VAC', ...SW, warehouse: 'WH3', ai_class: 'Rocker-Switch' },
  { code: 'SW-004', name: 'Nút nhấn tact switch 6x6mm', category: 'Công tắc và nút bấm', unit: 'Cái', specs: '6x6mm, 4 chân, gắn PCB', ...SW, warehouse: 'WH3', ai_class: 'Tact-Switch' },
  { code: 'SW-005', name: 'Nút nhấn tact switch vuông có nắp', category: 'Công tắc và nút bấm', unit: 'Cái', specs: '6x6mm, có nắp nhựa màu', ...SW, warehouse: 'WH3', ai_class: null },

  // ── Pin và nguồn ──
  { code: 'PWR-001', name: 'Pin AA 1.5V', category: 'Pin và nguồn', unit: 'Viên', specs: '1.5V, Alkaline', ...PWR, warehouse: 'WH3', ai_class: '1-5-Volt-Battery' },
  { code: 'PWR-002', name: 'Pin cúc áo 3.3V (CR-series)', category: 'Pin và nguồn', unit: 'Viên', specs: '3.3V, dạng cúc áo', ...PWR, warehouse: 'WH3', ai_class: '3-3-Volt-Battery' },
  { code: 'PWR-003', name: 'Pin vuông 9V', category: 'Pin và nguồn', unit: 'Viên', specs: '9V, Alkaline, đầu kẹp', ...PWR, warehouse: 'WH3', ai_class: '9-Volt-Battery' },
  { code: 'PWR-004', name: 'Pin sạc Li-ion 18650 3.7V', category: 'Pin và nguồn', unit: 'Viên', specs: '3.7V, 2200mAh, có bảo vệ', ...PWR, warehouse: 'WH3', ai_class: null },

  // ── Phụ kiện ──
  { code: 'ACC-001', name: 'Breadboard 830 lỗ', category: 'Breadboard', unit: 'Cái', specs: '830 lỗ cắm, 2 đường nguồn mỗi bên', ...ACC, warehouse: 'WH1', ai_class: 'Breadboard' },
  { code: 'ACC-002', name: 'Cầu chì ống thủy tinh 5x20mm 1A', category: 'Cầu chì', unit: 'Cái', specs: '5x20mm, 1A, 250V', ...ACC, warehouse: 'WH1', ai_class: 'Fuse' },
  { code: 'ACC-003', name: 'Đế cầu chì 5x20mm (gắn PCB)', category: 'Cầu chì', unit: 'Cái', specs: 'Gắn PCB, cho ống cầu chì 5x20mm', ...ACC, warehouse: 'WH1', ai_class: 'Fuse-Base' },
  { code: 'ACC-004', name: 'Tản nhiệt nhôm TO-220', category: 'Tản nhiệt', unit: 'Cái', specs: 'Nhôm, cho IC/transistor gói TO-220', ...ACC, warehouse: 'WH1', ai_class: 'Heat-Sink' },
  { code: 'ACC-005', name: 'Đế IC 14 chân (DIP-14)', category: 'Đế IC', unit: 'Cái', specs: 'DIP-14, chân mạ vàng', ...ACC, warehouse: 'WH1', ai_class: 'IC-Base-14-Pin' },
  { code: 'ACC-006', name: 'Đế IC 28 chân (DIP-28)', category: 'Đế IC', unit: 'Cái', specs: 'DIP-28, chân mạ vàng', ...ACC, warehouse: 'WH1', ai_class: 'IC-Base-28-Pin' },
  { code: 'ACC-007', name: 'Header chân cắm thẳng 40 chân (2.54mm)', category: 'Header', unit: 'Thanh', specs: '1x40 chân, bước 2.54mm, bẻ được', ...ACC, warehouse: 'WH1', ai_class: 'Pin-Header' },
  { code: 'ACC-008', name: 'Dây jumper đực-đực (bộ 40 sợi)', category: 'Phụ kiện', unit: 'Bộ', specs: 'Bộ 40 sợi, dài 20cm', ...ACC, warehouse: 'WH1', ai_class: null },
];
