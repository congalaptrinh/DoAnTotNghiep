import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';
import { Tabs } from '../components/ui';

const categories = [
  {
    id: 'DM-001', name: 'Vi mạch tích hợp (IC)', code: 'IC', items: 145,
    children: [
      { id: 'DM-001-1', name: 'IC Logic', code: 'IC-LOG', items: 42 },
      { id: 'DM-001-2', name: 'IC Khuếch đại', code: 'IC-AMP', items: 38 },
      { id: 'DM-001-3', name: 'IC Bộ nhớ', code: 'IC-MEM', items: 25 },
      { id: 'DM-001-4', name: 'IC Vi điều khiển', code: 'IC-MCU', items: 40 },
    ],
  },
  {
    id: 'DM-002', name: 'Linh kiện thụ động', code: 'LKT', items: 312,
    children: [
      { id: 'DM-002-1', name: 'Tụ điện', code: 'LKT-CAP', items: 88 },
      { id: 'DM-002-2', name: 'Điện trở', code: 'LKT-RES', items: 120 },
      { id: 'DM-002-3', name: 'Cuộn cảm', code: 'LKT-IND', items: 34 },
      { id: 'DM-002-4', name: 'Thạch anh dao động', code: 'LKT-XTA', items: 70 },
    ],
  },
  {
    id: 'DM-003', name: 'Module & Development Board', code: 'MOD', items: 89,
    children: [
      { id: 'DM-003-1', name: 'Arduino & Clone', code: 'MOD-ARD', items: 22 },
      { id: 'DM-003-2', name: 'ESP8266 / ESP32', code: 'MOD-ESP', items: 18 },
      { id: 'DM-003-3', name: 'Raspberry Pi', code: 'MOD-RPI', items: 12 },
      { id: 'DM-003-4', name: 'Module cảm biến', code: 'MOD-SEN', items: 37 },
    ],
  },
  {
    id: 'DM-004', name: 'Thiết bị đo & kiểm tra', code: 'THIET-BI', items: 56,
    children: [
      { id: 'DM-004-1', name: 'Đồng hồ vạn năng', code: 'TB-DMM', items: 8 },
      { id: 'DM-004-2', name: 'Bộ nguồn lab', code: 'TB-PSU', items: 12 },
      { id: 'DM-004-3', name: 'Máy hàn & công cụ', code: 'TB-SOL', items: 36 },
    ],
  },
];

const itemsData = [
  { id: 'SP-0001', name: 'IC555 Timer', category: 'IC Logic', unit: 'Cái', min: 50, max: 500, status: 'active', img: '🔌' },
  { id: 'SP-0002', name: 'Tụ điện 100μF 16V', category: 'Tụ điện', unit: 'Cái', min: 100, max: 1000, status: 'active', img: '⚡' },
  { id: 'SP-0003', name: 'Arduino Uno R3', category: 'Arduino & Clone', unit: 'Bộ', min: 5, max: 50, status: 'active', img: '🖥️' },
  { id: 'SP-0004', name: 'Relay 5V 10A', category: 'Module công suất', unit: 'Cái', min: 10, max: 100, status: 'active', img: '🔧' },
  { id: 'SP-0005', name: 'ESP32 WiFi+BT Dev Kit', category: 'ESP8266 / ESP32', unit: 'Cái', min: 20, max: 200, status: 'active', img: '📡' },
  { id: 'SP-0006', name: 'Điện trở 10kΩ 1/4W', category: 'Điện trở', unit: 'Cái', min: 200, max: 5000, status: 'active', img: '〰️' },
  { id: 'SP-0007', name: 'Module L298N Driver', category: 'Module công suất', unit: 'Cái', min: 5, max: 30, status: 'inactive', img: '🔋' },
  { id: 'SP-0008', name: 'Cảm biến nhiệt độ DHT22', category: 'Module cảm biến', unit: 'Cái', min: 10, max: 100, status: 'active', img: '🌡️' },
];

export default function CategoriesPage() {
  const [tab, setTab] = useState<'categories' | 'items'>('categories');
  const [expanded, setExpanded] = useState<string[]>(['DM-001', 'DM-002']);

  const toggle = (id: string) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <PageLayout
      title={tab === 'categories' ? 'Danh mục vật tư' : 'Danh mục & Vật tư'}
      subtitle="Quản lý cây danh mục và từ điển vật tư của hệ thống"
      actions={
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'categories', label: 'Danh mục' },
              { value: 'items', label: 'Vật tư' },
            ]}
          />
          <Btn>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            {tab === 'categories' ? 'Thêm danh mục' : 'Thêm vật tư'}
          </Btn>
        </>
      }
    >
      {tab === 'categories' ? (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Tổng: <b className="text-gray-900">4 danh mục chính</b>, <b className="text-gray-900">15 danh mục con</b></span>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <div key={cat.id}>
                {/* Parent row */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors"
                  onClick={() => toggle(cat.id)}
                >
                  <button className="w-5 h-5 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                      strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform ${expanded.includes(cat.id) ? 'rotate-90' : ''}`}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-xs">{cat.code.substring(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400">({cat.code})</span>
                  </div>
                  <Badge color="indigo">{cat.items} vật tư</Badge>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Children */}
                {expanded.includes(cat.id) && cat.children.map((child) => (
                  <div key={child.id} className="flex items-center gap-3 px-5 py-2.5 pl-14 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{child.name} <span className="text-gray-400">({child.code})</span></span>
                    <Badge color="gray">{child.items} vật tư</Badge>
                    <div className="flex items-center gap-1 ml-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">Tổng: <b className="text-gray-900">{itemsData.length} vật tư</b></p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Ảnh</Th>
                  <Th>Mã vật tư</Th>
                  <Th>Tên vật tư</Th>
                  <Th>Danh mục</Th>
                  <Th>Đơn vị</Th>
                  <Th className="text-right">Ngưỡng min</Th>
                  <Th className="text-right">Ngưỡng max</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {itemsData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <Td>
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                        {item.img}
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs text-gray-500">{item.id}</span></Td>
                    <Td><span className="font-semibold text-gray-900">{item.name}</span></Td>
                    <Td><span className="text-gray-500 text-sm">{item.category}</span></Td>
                    <Td>{item.unit}</Td>
                    <Td className="text-right text-gray-700">{item.min.toLocaleString()}</Td>
                    <Td className="text-right text-gray-700">{item.max.toLocaleString()}</Td>
                    <Td>
                      <Badge color={item.status === 'active' ? 'green' : 'gray'}>
                        {item.status === 'active' ? 'Đang dùng' : 'Ngưng dùng'}
                      </Badge>
                    </Td>
                    <Td>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
