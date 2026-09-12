import { useState } from 'react';
import PageLayout, { Card, Badge, Btn, Th, Td } from '../components/PageLayout';
import { Stepper, Modal } from '../components/ui';

const receipts = [
  { id: 'NK-2025-0891', date: '05/09/2025 09:42', supplier: 'Bách Khoa Electronics', creator: 'Trần Văn Bình', items: 3, qty: 250, status: 'approved' },
  { id: 'NK-2025-0890', date: '04/09/2025 14:15', supplier: 'Saigon Components', creator: 'Nguyễn Văn An', items: 5, qty: 480, status: 'pending' },
  { id: 'NK-2025-0889', date: '03/09/2025 11:30', supplier: 'TI / Mouser VN', creator: 'Lê Thị Hoa', items: 2, qty: 100, status: 'approved' },
  { id: 'NK-2025-0888', date: '02/09/2025 16:00', supplier: 'Arduino Vietnam', creator: 'Phạm Thanh Tú', items: 4, qty: 85, status: 'draft' },
  { id: 'NK-2025-0887', date: '01/09/2025 08:45', supplier: 'Bách Khoa Electronics', creator: 'Trần Văn Bình', items: 6, qty: 1200, status: 'approved' },
];

const statusConfig = {
  draft: { label: 'Nháp', color: 'gray' as const },
  pending: { label: 'Chờ duyệt', color: 'yellow' as const },
  approved: { label: 'Đã duyệt', color: 'green' as const },
};

const aiDetected = [
  { id: 1, name: 'IC555 Timer', code: 'SP-0001', qty: 3, unit: 'Cái', confidence: 97, location: 'A1-01-K3', color: 'border-green-400' },
  { id: 2, name: 'Tụ 100μF 16V', code: 'SP-0002', qty: 12, unit: 'Cái', confidence: 94, location: 'A2-03-K1', color: 'border-blue-400' },
  { id: 3, name: 'Điện trở 10kΩ', code: 'SP-0006', qty: 50, unit: 'Cái', confidence: 91, location: 'A1-02-K1', color: 'border-yellow-400' },
  { id: 4, name: 'Relay 5V 10A', code: 'SP-0004', qty: 5, unit: 'Cái', confidence: 88, location: 'A3-01-K4', color: 'border-red-400' },
  { id: 5, name: 'LED 5mm Đỏ', code: 'SP-0015', qty: 30, unit: 'Cái', confidence: 85, location: '', color: 'border-purple-400' },
];

export default function ImportPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [step, setStep] = useState(1);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedQtys, setDetectedQtys] = useState<number[]>(aiDetected.map((d) => d.qty));
  const [locations, setLocations] = useState<string[]>(aiDetected.map((d) => d.location));
  const [detailId, setDetailId] = useState<string | null>(null);

  function handleAnalyze() {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1800);
  }

  const steps = ['Chụp ảnh / AI phân tích', 'Xác nhận danh sách', 'Hoàn tất nhập kho'];

  if (view === 'create') {
    return (
      <PageLayout
        title="Tạo phiếu nhập kho"
        subtitle="Sử dụng AI để tự động nhận diện linh kiện qua ảnh chụp"
        actions={
          <Btn variant="secondary" onClick={() => { setView('list'); setStep(1); setAnalyzed(false); }}>
            ← Quay lại danh sách
          </Btn>
        }
      >
        <Stepper steps={steps} current={step} />

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ảnh chụp linh kiện</h3>
              {!analyzed ? (
                <div>
                  <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50" style={{ aspectRatio: '16/9' }}>
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&auto=format"
                      alt="Linh kiện điện tử được chụp"
                      className="w-full h-full object-cover opacity-80"
                    />
                    {analyzing && (
                      <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white font-semibold">AI đang phân tích...</span>
                        <span className="text-white/70 text-sm">Đang nhận diện linh kiện</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Btn variant="secondary" size="sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Tải ảnh lên
                    </Btn>
                    <Btn onClick={handleAnalyze} variant="primary" size="sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                      Phân tích bằng AI
                    </Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&auto=format"
                      alt="Linh kiện điện tử với bounding boxes"
                      className="w-full h-full object-cover"
                    />
                    {/* Bounding boxes */}
                    <div className="absolute inset-0">
                      <div className="absolute border-2 border-green-400 rounded" style={{ left: '8%', top: '15%', width: '20%', height: '30%' }}>
                        <span className="absolute -top-5 left-0 bg-green-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">IC555 ×3</span>
                      </div>
                      <div className="absolute border-2 border-blue-400 rounded" style={{ left: '32%', top: '10%', width: '24%', height: '35%' }}>
                        <span className="absolute -top-5 left-0 bg-blue-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">Tụ 100μF ×12</span>
                      </div>
                      <div className="absolute border-2 border-yellow-400 rounded" style={{ left: '60%', top: '20%', width: '22%', height: '22%' }}>
                        <span className="absolute -top-5 left-0 bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">Điện trở ×50</span>
                      </div>
                      <div className="absolute border-2 border-red-400 rounded" style={{ left: '15%', top: '55%', width: '28%', height: '32%' }}>
                        <span className="absolute -top-5 left-0 bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">Relay 5V ×5</span>
                      </div>
                      <div className="absolute border-2 border-purple-400 rounded" style={{ left: '52%', top: '55%', width: '18%', height: '28%' }}>
                        <span className="absolute -top-5 left-0 bg-purple-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">LED 5mm ×30</span>
                      </div>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-indigo-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      AI: 5 loại • 100 vật tư
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiDetected.map((d) => (
                      <span key={d.id} className={`text-xs border-2 ${d.color} px-2 py-1 rounded-lg font-semibold text-gray-700`}>
                        {d.name} ×{d.qty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Thông tin phiếu</h3>
              <div className="space-y-4">
                {[
                  { label: 'Nhà cung cấp', placeholder: 'Chọn nhà cung cấp...' },
                  { label: 'Kho nhập', placeholder: 'Kho A - Chính' },
                  { label: 'Số hóa đơn NCC', placeholder: 'INV-2025-...' },
                  { label: 'Ghi chú', placeholder: 'Nhập ghi chú...' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                {analyzed ? (
                  <Btn onClick={() => setStep(2)}>
                    Tiếp theo: Xác nhận danh sách →
                  </Btn>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Tải ảnh lên và nhấn "Phân tích bằng AI" để tiếp tục
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {step === 2 && (
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Xác nhận danh sách vật tư nhập kho</h3>
              <Badge color="green">AI phát hiện {aiDetected.length} mặt hàng</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Vật tư</Th>
                    <Th>Mã SP</Th>
                    <Th className="text-right">Độ tin cậy AI</Th>
                    <Th className="text-right">Số lượng</Th>
                    <Th>Vị trí lưu kho</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {aiDetected.map((item, i) => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 ${item.color} flex-shrink-0`} />
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </Td>
                      <Td><span className="font-mono text-xs text-gray-500">{item.code}</span></Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.confidence >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${item.confidence}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${item.confidence >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{item.confidence}%</span>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <input
                          type="number"
                          value={detectedQtys[i]}
                          onChange={(e) => {
                            const n = [...detectedQtys];
                            n[i] = parseInt(e.target.value) || 0;
                            setDetectedQtys(n);
                          }}
                          className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </Td>
                      <Td>
                        <input
                          type="text"
                          value={locations[i]}
                          onChange={(e) => {
                            const n = [...locations];
                            n[i] = e.target.value;
                            setLocations(n);
                          }}
                          placeholder="VD: A1-01-K3"
                          className={`w-32 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${!locations[i] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                        />
                      </Td>
                      <Td>
                        <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <Btn variant="secondary" onClick={() => setStep(1)}>← Quay lại</Btn>
              <div className="flex gap-3">
                <Btn variant="ghost">Lưu nháp</Btn>
                <Btn onClick={() => setStep(3)}>Hoàn tất nhập kho →</Btn>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <div className="max-w-lg mx-auto">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nhập kho thành công!</h3>
              <p className="text-gray-500 mb-1">Phiếu nhập kho <b className="text-gray-900">NK-2025-0892</b> đã được tạo</p>
              <p className="text-gray-500 mb-6">5 mặt hàng • 100 đơn vị đã được nhập vào Kho A</p>
              <div className="flex gap-3 justify-center">
                <Btn variant="secondary" onClick={() => { setView('list'); setStep(1); setAnalyzed(false); }}>
                  Về danh sách phiếu
                </Btn>
                <Btn onClick={() => { setStep(1); setAnalyzed(false); }}>
                  Tạo phiếu mới
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </PageLayout>
    );
  }

  const detail = receipts.find((r) => r.id === detailId);

  return (
    <PageLayout
      title="Nhập kho"
      subtitle="Quản lý phiếu nhập kho với AI nhận diện linh kiện tự động"
      actions={
        <Btn onClick={() => setView('create')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Tạo phiếu nhập
        </Btn>
      }
    >
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Mã phiếu</Th>
                <Th>Ngày tạo</Th>
                <Th>Nhà cung cấp</Th>
                <Th>Người tạo</Th>
                <Th className="text-right">Số mặt hàng</Th>
                <Th className="text-right">Tổng SL</Th>
                <Th>Trạng thái</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetailId(r.id)}>
                  <Td><span className="font-mono text-sm font-semibold text-indigo-600">{r.id}</span></Td>
                  <Td><span className="text-sm text-gray-500">{r.date}</span></Td>
                  <Td><span className="font-medium text-gray-900">{r.supplier}</span></Td>
                  <Td>{r.creator}</Td>
                  <Td className="text-right">{r.items}</Td>
                  <Td className="text-right font-semibold text-gray-900">{r.qty}</Td>
                  <Td>
                    <Badge color={statusConfig[r.status as keyof typeof statusConfig].color}>
                      {statusConfig[r.status as keyof typeof statusConfig].label}
                    </Badge>
                  </Td>
                  <Td>
                    <Btn variant="ghost" size="sm" onClick={(e?: React.MouseEvent) => { e?.stopPropagation(); setDetailId(r.id); }}>Xem</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Chi tiết phiếu nhập kho" size="lg">
        {detail && (
          <>
            <p className="font-mono text-sm text-indigo-600 -mt-3 mb-4">{detail.id}</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Nhà cung cấp', value: detail.supplier },
                { label: 'Người tạo', value: detail.creator },
                { label: 'Ngày tạo', value: detail.date },
                { label: 'Trạng thái', value: statusConfig[detail.status as keyof typeof statusConfig].label },
                { label: 'Số mặt hàng', value: `${detail.items} loại` },
                { label: 'Tổng số lượng', value: `${detail.qty} đơn vị` },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Badge color={statusConfig[detail.status as keyof typeof statusConfig].color}>
                {statusConfig[detail.status as keyof typeof statusConfig].label}
              </Badge>
              <div className="flex gap-2">
                {detail.status === 'pending' && <Btn size="sm">Phê duyệt</Btn>}
                <Btn variant="secondary" size="sm" onClick={() => setDetailId(null)}>Đóng</Btn>
              </div>
            </div>
          </>
        )}
      </Modal>
    </PageLayout>
  );
}
