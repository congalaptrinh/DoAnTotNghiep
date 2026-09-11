# 07 — DECISIONS LOG

> File này ghi lại các quyết định **thực tế** phát sinh trong quá trình code mà spec gốc (00–06) chưa nói rõ 100%, hoặc các chi tiết implementation mà các phần sau (Web, Mobile, AI Service) cần biết chính xác để không code lệch.
>
> **AI agent: mỗi khi tự quyết định một chi tiết không có sẵn trong spec (tên field, format response, cấu trúc lỗi, quy ước đặt tên route, enum value...), hãy thêm 1 mục mới vào đây ngay lúc đó — đừng để cuối mới nhớ lại.**

Định dạng mỗi mục:

```
## [Ngày] — [Tên quyết định ngắn gọn]
- Bối cảnh: vì sao cần quyết định
- Quyết định: chọn gì
- Ảnh hưởng tới: (Backend / Web / Mobile / AI Service — phần nào cần biết điều này)
```

---

## Ví dụ (xoá dòng này khi bắt đầu ghi thật)

## 2026-07-12 — Cấu trúc thư mục Backend
- Bối cảnh: spec không quy định cụ thể cấu trúc folder.
- Quyết định: `src/routes`, `src/controllers`, `src/services`, `src/middlewares`, `src/prisma` (schema + client).
- Ảnh hưởng tới: Backend (các phiên code sau cần theo đúng cấu trúc này).

---

*(Bắt đầu ghi các quyết định thật từ đây)*
