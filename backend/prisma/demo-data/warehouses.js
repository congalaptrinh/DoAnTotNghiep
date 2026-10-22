// 3 kho demo, mỗi kho 1 danh sách vị trí mã hoá "khu vực-kệ-ngăn" (A1-K2-N3).
// `key` dùng nội bộ (items.js trỏ tới qua field `warehouse`), không lưu vào DB.

function genLocations(areas, shelvesPerArea, drawersPerShelf) {
  const codes = [];
  for (const area of areas) {
    for (let shelf = 1; shelf <= shelvesPerArea; shelf += 1) {
      for (let drawer = 1; drawer <= drawersPerShelf; drawer += 1) {
        codes.push(`${area}1-K${shelf}-N${drawer}`);
      }
    }
  }
  return codes.map((location_code) => ({ location_code }));
}

module.exports = [
  {
    key: 'WH1',
    warehouse_name: 'Kho linh kiện chính',
    address: '12 Đường Công Nghiệp 5, Phường Tân Tạo, TP. Hồ Chí Minh',
    description: 'Lưu trữ linh kiện thụ động, bán dẫn và phụ kiện lắp ráp',
    locations: genLocations(['A', 'B'], 3, 2), // 12 vị trí
  },
  {
    key: 'WH2',
    warehouse_name: 'Kho module và vi điều khiển',
    address: '45 Đường Thống Nhất, Phường Dĩ An, Bình Dương',
    description: 'Lưu trữ board mạch, module chức năng, cảm biến, linh kiện hiển thị',
    locations: genLocations(['A', 'B'], 3, 2).slice(0, 10), // 10 vị trí
  },
  {
    key: 'WH3',
    warehouse_name: 'Kho thiết bị và dụng cụ',
    address: '78 Đường Lê Văn Việt, Thành phố Thủ Đức, TP. Hồ Chí Minh',
    description: 'Lưu trữ động cơ, công tắc, pin và nguồn',
    locations: genLocations(['A', 'B'], 2, 2), // 8 vị trí
  },
];
