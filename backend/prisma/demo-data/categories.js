// Cây danh mục vật tư demo — mỗi phần tử gốc có thể có `children` (danh mục con).
// `items.js` gắn từng vật tư vào ĐÚNG 1 category theo field `category` (tên lá,
// hoặc tên danh mục gốc nếu gốc đó không có con / vật tư gắn thẳng vào gốc).
module.exports = [
  {
    name: 'Linh kiện thụ động',
    description: 'Điện trở, tụ điện, cuộn cảm, biến trở',
    children: ['Điện trở', 'Tụ điện', 'Cuộn cảm', 'Biến trở'],
  },
  {
    name: 'Linh kiện bán dẫn',
    description: 'Diode, transistor, MOSFET, IGBT, IC',
    children: ['Diode', 'Transistor BJT', 'MOSFET', 'IGBT', 'IC'],
  },
  {
    name: 'Vi điều khiển và board mạch',
    description: 'Arduino, ESP32, board mở rộng',
    children: ['Arduino', 'ESP32', 'Board mở rộng'],
  },
  {
    name: 'Module chức năng',
    description: 'Module giao tiếp, nguồn, điều khiển động cơ, rơ-le',
    children: ['Module giao tiếp', 'Module nguồn', 'Module điều khiển động cơ', 'Module rơ-le'],
  },
  { name: 'Cảm biến', description: 'Các loại cảm biến nhiệt độ, độ ẩm, khoảng cách, ánh sáng...' },
  { name: 'Hiển thị', description: 'Màn hình, LED, còi báo' },
  { name: 'Động cơ', description: 'Động cơ DC, servo' },
  { name: 'Công tắc và nút bấm', description: 'Công tắc, nút nhấn, bàn phím' },
  { name: 'Pin và nguồn', description: 'Pin, nguồn cấp' },
  {
    name: 'Phụ kiện',
    description: 'Breadboard, tản nhiệt, đế IC, header, cầu chì',
    children: ['Breadboard', 'Tản nhiệt', 'Đế IC', 'Header', 'Cầu chì'],
  },
];
