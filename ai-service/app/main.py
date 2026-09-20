"""AI Service — nhan dien linh kien dien tu bang YOLOv9 (fine-tune tren ElectroCom61).

Cau truc JSON tra ve o /detect PHAI khop 100% voi cau truc da chot trong
specs/05-AI-SERVICE-SPEC.md va specs/07-DECISIONS-LOG.md (phan mock AI o
Backend `backend/src/services/ai.service.js`) — Web/Mobile da code san doc
theo cau truc nay tu ban mock, doi field se lam vo luong AI o ca 2 noi do.

Model duoc huan luyen bang ma nguon fork SkalskiP/yolov9 (khong phai package
pip `ultralytics`) nen phai nap + infer bang chinh code cua repo do, vendor
tai `../yolov9_src` — xem giai thich day du trong specs/07-DECISIONS-LOG.md
va requirements.txt.
"""

import base64
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
_YOLOV9_SRC = _ROOT / "yolov9_src"
if str(_YOLOV9_SRC) not in sys.path:
    sys.path.insert(0, str(_YOLOV9_SRC))

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile

from models.common import DetectMultiBackend  # noqa: E402 (vendor code, xem sys.path o tren)
from utils.augmentations import letterbox  # noqa: E402
from utils.general import check_img_size, non_max_suppression, scale_boxes  # noqa: E402
from utils.plots import Annotator, colors  # noqa: E402
from utils.torch_utils import select_device  # noqa: E402

MODEL_PATH = _ROOT / "models" / "best.pt"
CONF_THRES = 0.25
IOU_THRES = 0.45
IMG_SIZE = 640

app = FastAPI(title="TechStore WMS AI Service")

model: DetectMultiBackend | None = None
_imgsz = (IMG_SIZE, IMG_SIZE)


@app.on_event("startup")
def load_model() -> None:
    global model, _imgsz
    device = select_device("cpu")
    model = DetectMultiBackend(str(MODEL_PATH), device=device)
    _imgsz = check_img_size((IMG_SIZE, IMG_SIZE), s=model.stride)
    model.warmup(imgsz=(1, 3, *_imgsz))  # chay 1 lan luc startup, tranh request dau tien bi cham


@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok", "model_loaded": model is not None}}


@app.get("/classes")
def classes():
    """Liet ke toan bo lop model nhan dien duoc — phuc vu Giai doan E (mapping
    ten lop AI <-> vat tu that trong database)."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model chua duoc load")
    names = [model.names[i] for i in sorted(model.names)]
    return {"success": True, "data": {"count": len(names), "class_names": names}}


def _preprocess(frame: np.ndarray) -> torch.Tensor:
    im = letterbox(frame, _imgsz, stride=model.stride, auto=model.pt)[0]
    im = im.transpose((2, 0, 1))[::-1]  # HWC->CHW, BGR->RGB
    im = np.ascontiguousarray(im)
    tensor = torch.from_numpy(im).to(model.device).float() / 255
    if tensor.ndim == 3:
        tensor = tensor[None]
    return tensor


def _build_summary(detections: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for d in detections:
        counts[d["class_name"]] = counts.get(d["class_name"], 0) + 1
    return [{"class_name": name, "count": count} for name, count in counts.items()]


@app.post("/detect")
async def detect(image: UploadFile | None = File(None)):
    # `image: UploadFile = File(...)` (bat buoc) khien FastAPI tu tra 422 truoc
    # khi vao duoc ham nay neu thieu han field "image" — checklist D4 yeu cau
    # 400 ro rang (giong Backend mock: ApiError(400, ...)), nen nhan Optional
    # roi tu kiem tra de luon tra ve 1 dang loi nhat quan du thieu field hay
    # field rong.
    if model is None:
        raise HTTPException(status_code=503, detail="Model chua duoc load")

    if image is None:
        raise HTTPException(status_code=400, detail='Vui long chon anh de nhan dien (field "image")')

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail='Vui long chon anh de nhan dien (field "image")')

    npimg = np.frombuffer(raw, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="File tai len khong phai anh hop le")

    tensor = _preprocess(frame)
    with torch.no_grad():
        pred = model(tensor)
    pred = pred[0][1] if isinstance(pred[0], list) else pred[0]
    pred = non_max_suppression(pred, CONF_THRES, IOU_THRES, max_det=300)[0]

    detections = []
    annotator = Annotator(frame.copy(), line_width=2, example=str(model.names))
    if len(pred):
        pred[:, :4] = scale_boxes(tensor.shape[2:], pred[:, :4], frame.shape).round()
        for *xyxy, conf, cls in reversed(pred):
            class_name = model.names[int(cls)]
            x1, y1, x2, y2 = (float(v) for v in xyxy)
            detections.append(
                {
                    "class_name": class_name,
                    "confidence": round(float(conf), 4),
                    "bounding_box": {
                        "x": round(x1, 1),
                        "y": round(y1, 1),
                        "width": round(x2 - x1, 1),
                        "height": round(y2 - y1, 1),
                    },
                }
            )
            annotator.box_label(xyxy, f"{class_name} {conf:.2f}", color=colors(int(cls), True))

    summary = _build_summary(detections)

    annotated = annotator.result()
    ok, buf = cv2.imencode(".jpg", annotated)
    if not ok:
        raise HTTPException(status_code=500, detail="Khong the tao anh ket qua")
    annotated_image = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"

    return {
        "success": True,
        "data": {
            "detections": detections,
            "summary": summary,
            "annotated_image": annotated_image,
        },
        "message": "Nhan dien thanh cong",
    }
