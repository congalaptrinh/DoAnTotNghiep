"""So sanh truc tiep model CU (best_v1_2071img.pt, train tren 2071 anh goc)
voi model MOI (best.pt, train tren ~13k anh sau augmentation) — chay thang
qua ham inference (khong qua HTTP) de test ca 2 model trong cung 1 lan chay,
tren CHINH XAC cung 1 bo anh da dung o Giai doan D truoc do (Wikimedia +
anh trang) va bo anh valid/ that cua ElectroCom61 (co nhan that de tinh %
dung).

Dung lai ham tien xu ly/hau xu ly y het app/main.py (letterbox + NMS +
scale_boxes) de ket qua so sanh cong bang, khong lech do khac pipeline.
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np
import torch
import yaml
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "yolov9_src"))

from models.common import DetectMultiBackend  # noqa: E402
from utils.augmentations import letterbox  # noqa: E402
from utils.general import check_img_size, non_max_suppression, scale_boxes  # noqa: E402
from utils.torch_utils import select_device  # noqa: E402

CONF_THRES = 0.25
IOU_THRES = 0.45
IMG_SIZE = 640
IOU_MATCH_THRES = 0.5

VALID_DIR = BASE_DIR / "test_images" / "electrocom_valid"
with open(VALID_DIR / "data.yaml", encoding="utf-8") as f:
    CLASS_NAMES_GT = yaml.safe_load(f)["names"]

WIKI_IMAGES = [
    BASE_DIR / "test_images" / "resistors_multi.jpg",
    BASE_DIR / "test_images" / "ic_multi.jpg",
    BASE_DIR / "test_images" / "blank.jpg",
]
VALID_IMAGES = sorted(p for p in VALID_DIR.glob("*.jpg") if p.with_suffix(".txt").exists())


def load_model(weights: str) -> DetectMultiBackend:
    device = select_device("cpu")
    model = DetectMultiBackend(weights, device=device)
    imgsz = check_img_size((IMG_SIZE, IMG_SIZE), s=model.stride)
    model.warmup(imgsz=(1, 3, *imgsz))
    model._imgsz = imgsz
    return model


def run_detect(model: DetectMultiBackend, frame: np.ndarray) -> list[dict]:
    im = letterbox(frame, model._imgsz, stride=model.stride, auto=model.pt)[0]
    im = im.transpose((2, 0, 1))[::-1]
    im = np.ascontiguousarray(im)
    tensor = torch.from_numpy(im).to(model.device).float() / 255
    if tensor.ndim == 3:
        tensor = tensor[None]

    with torch.no_grad():
        pred = model(tensor)
    pred = pred[0][1] if isinstance(pred[0], list) else pred[0]
    pred = non_max_suppression(pred, CONF_THRES, IOU_THRES, max_det=300)[0]

    detections = []
    if len(pred):
        pred[:, :4] = scale_boxes(tensor.shape[2:], pred[:, :4], frame.shape).round()
        for *xyxy, conf, cls in reversed(pred):
            x1, y1, x2, y2 = (float(v) for v in xyxy)
            detections.append(
                {
                    "class_name": model.names[int(cls)],
                    "confidence": round(float(conf), 4),
                    "box": (x1, y1, x2, y2),
                }
            )
    return detections


def yolo_to_xyxy(cx, cy, w, h, img_w, img_h):
    return (cx - w / 2) * img_w, (cy - h / 2) * img_h, (cx + w / 2) * img_w, (cy + h / 2) * img_h


def iou(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def score_against_gt(detections: list[dict], label_path: Path, img_w: int, img_h: int) -> dict:
    gts = []
    for line in label_path.read_text().strip().splitlines():
        if not line.strip():
            continue
        parts = line.split()
        cls_id = int(parts[0])
        cx, cy, w, h = map(float, parts[1:5])
        gts.append({"class_name": CLASS_NAMES_GT[cls_id], "box": yolo_to_xyxy(cx, cy, w, h, img_w, img_h), "matched": False})

    preds_sorted = sorted(detections, key=lambda p: -p["confidence"])
    correct = wrong_class = 0
    mismatches = []
    for p in preds_sorted:
        best_gt, best_iou = None, 0.0
        for gt in gts:
            if gt["matched"]:
                continue
            s = iou(p["box"], gt["box"])
            if s > best_iou:
                best_iou, best_gt = s, gt
        if best_gt is not None and best_iou >= IOU_MATCH_THRES:
            best_gt["matched"] = True
            if p["class_name"] == best_gt["class_name"]:
                correct += 1
            else:
                wrong_class += 1
                mismatches.append({"gt": best_gt["class_name"], "pred": p["class_name"], "conf": p["confidence"]})
    missed = sum(1 for gt in gts if not gt["matched"])
    extra_fp = len(detections) - correct - wrong_class
    missed_classes = [gt["class_name"] for gt in gts if not gt["matched"]]
    return {
        "gt_count": len(gts),
        "correct": correct,
        "wrong_class": wrong_class,
        "missed": missed,
        "extra_fp": extra_fp,
        "mismatches": mismatches,
        "missed_classes": missed_classes,
    }


def summarize_wiki(detections: list[dict]) -> str:
    if not detections:
        return "khong phat hien gi"
    counts: dict[str, int] = {}
    for d in detections:
        counts[d["class_name"]] = counts.get(d["class_name"], 0) + 1
    parts = [f"{name} x{count} (conf cao nhat {max(d['confidence'] for d in detections if d['class_name'] == name):.2f})" for name, count in counts.items()]
    return f"{len(detections)} detection: " + ", ".join(parts)


def main():
    print("Dang load model CU (best_v1_2071img.pt, 2071 anh)...", file=sys.stderr)
    old_model = load_model(str(BASE_DIR / "models" / "best_v1_2071img.pt"))
    print("Dang load model MOI (best.pt, ~13k anh)...", file=sys.stderr)
    new_model = load_model(str(BASE_DIR / "models" / "best.pt"))

    report = {"wikimedia": [], "electrocom_valid": []}

    print("\n=== ANH THAT NGOAI DATASET (Wikimedia + anh trang) ===", file=sys.stderr)
    for img_path in WIKI_IMAGES:
        frame = cv2.imread(str(img_path))
        old_det = run_detect(old_model, frame)
        new_det = run_detect(new_model, frame)
        print(f"\n--- {img_path.name} ---", file=sys.stderr)
        print(f"  CU : {summarize_wiki(old_det)}", file=sys.stderr)
        print(f"  MOI: {summarize_wiki(new_det)}", file=sys.stderr)
        report["wikimedia"].append({"image": img_path.name, "old": old_det, "new": new_det})

    print("\n=== ANH THAT TU valid/ CUA ElectroCom61 (co nhan that de tinh %) ===", file=sys.stderr)
    old_totals = {"gt": 0, "correct": 0, "wrong_class": 0, "missed": 0, "extra_fp": 0}
    new_totals = {"gt": 0, "correct": 0, "wrong_class": 0, "missed": 0, "extra_fp": 0}
    for img_path in VALID_IMAGES:
        label_path = img_path.with_suffix(".txt")
        frame = cv2.imread(str(img_path))
        with Image.open(img_path) as im:
            img_w, img_h = im.size

        old_det = run_detect(old_model, frame)
        new_det = run_detect(new_model, frame)
        old_score = score_against_gt(old_det, label_path, img_w, img_h)
        new_score = score_against_gt(new_det, label_path, img_w, img_h)

        old_totals["gt"] += old_score["gt_count"]
        old_totals["correct"] += old_score["correct"]
        old_totals["wrong_class"] += old_score["wrong_class"]
        old_totals["missed"] += old_score["missed"]
        old_totals["extra_fp"] += old_score["extra_fp"]
        new_totals["gt"] += new_score["gt_count"]
        new_totals["correct"] += new_score["correct"]
        new_totals["wrong_class"] += new_score["wrong_class"]
        new_totals["missed"] += new_score["missed"]
        new_totals["extra_fp"] += new_score["extra_fp"]

        print(f"\n--- {img_path.name} (GT={old_score['gt_count']}) ---", file=sys.stderr)
        print(f"  CU : dung={old_score['correct']} sai-lop={old_score['wrong_class']} bo-sot={old_score['missed']} du-thua={old_score['extra_fp']}", file=sys.stderr)
        for m in old_score["mismatches"]:
            print(f"       CU nham: that la '{m['gt']}' -> doan '{m['pred']}' (conf {m['conf']})", file=sys.stderr)
        if old_score["missed_classes"]:
            print(f"       CU bo sot: {old_score['missed_classes']}", file=sys.stderr)
        print(f"  MOI: dung={new_score['correct']} sai-lop={new_score['wrong_class']} bo-sot={new_score['missed']} du-thua={new_score['extra_fp']}", file=sys.stderr)
        for m in new_score["mismatches"]:
            print(f"       MOI nham: that la '{m['gt']}' -> doan '{m['pred']}' (conf {m['conf']})", file=sys.stderr)
        if new_score["missed_classes"]:
            print(f"       MOI bo sot: {new_score['missed_classes']}", file=sys.stderr)

        report["electrocom_valid"].append({"image": img_path.name, "old": old_score, "new": new_score})

    def pct(t):
        return t["correct"] / t["gt"] * 100 if t["gt"] else 0.0

    print("\n=== TONG KET valid/ (61 lop, 6 anh, tong " + str(old_totals["gt"]) + " GT box) ===", file=sys.stderr)
    print(f"  MODEL CU  (2071 anh) : {old_totals['correct']}/{old_totals['gt']} dung = {pct(old_totals):.1f}%  (sai-lop={old_totals['wrong_class']}, bo-sot={old_totals['missed']}, du-thua={old_totals['extra_fp']})", file=sys.stderr)
    print(f"  MODEL MOI (~13k anh) : {new_totals['correct']}/{new_totals['gt']} dung = {pct(new_totals):.1f}%  (sai-lop={new_totals['wrong_class']}, bo-sot={new_totals['missed']}, du-thua={new_totals['extra_fp']})", file=sys.stderr)

    report["totals"] = {"old": old_totals, "new": new_totals}
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
