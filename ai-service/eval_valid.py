"""Danh gia model tren anh THAT tu tap valid/ cua chinh dataset ElectroCom61
(khong phai train/, chua tung duoc model nhin thay luc huan luyen) - de tach
bach van de "domain gap" (anh khac phong cach - da test bang anh Wikimedia)
khoi van de "model hoc chua du" (van sai ngay ca voi anh cung nguon/phong
cach voi du lieu train).

Cach cham: doc nhan that (.txt YOLO format) cua tung anh trong
test_images/electrocom_valid/, goi POST /detect, ghep moi GT box voi du doan
co IoU cao nhat (>=0.5) chua bi ghep - ghi nhan dung lop (TP), sai lop (dinh
vi dung nhung goi ten sai), bo sot (FN), va du doan thua khong khop GT nao
(FP). Khong dung file/thu vien nao ngoai requests (da co san trong venv).
"""

import json
import sys
from pathlib import Path

import requests
import yaml
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "test_images" / "electrocom_valid"
DETECT_URL = "http://127.0.0.1:8001/detect"
IOU_THRESHOLD = 0.5

with open(DATA_DIR / "data.yaml", encoding="utf-8") as f:
    CLASS_NAMES = yaml.safe_load(f)["names"]


def yolo_to_xyxy(cx, cy, w, h, img_w, img_h):
    x1 = (cx - w / 2) * img_w
    y1 = (cy - h / 2) * img_h
    x2 = (cx + w / 2) * img_w
    y2 = (cy + h / 2) * img_h
    return x1, y1, x2, y2


def iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def load_ground_truth(label_path: Path, img_w: int, img_h: int):
    gts = []
    for line in label_path.read_text().strip().splitlines():
        if not line.strip():
            continue
        parts = line.split()
        cls_id = int(parts[0])
        cx, cy, w, h = map(float, parts[1:5])
        box = yolo_to_xyxy(cx, cy, w, h, img_w, img_h)
        gts.append({"class_name": CLASS_NAMES[cls_id], "box": box, "matched": False})
    return gts


def main():
    images = sorted(DATA_DIR.glob("*.jpg"))
    total_gt = 0
    total_correct = 0
    total_wrong_class = 0
    total_missed = 0
    total_extra_fp = 0
    per_image_report = []

    for img_path in images:
        label_path = img_path.with_suffix(".txt")
        with Image.open(img_path) as im:
            img_w, img_h = im.size

        gts = load_ground_truth(label_path, img_w, img_h)

        with open(img_path, "rb") as f:
            resp = requests.post(DETECT_URL, files={"image": (img_path.name, f, "image/jpeg")})
        resp.raise_for_status()
        detections = resp.json()["data"]["detections"]

        preds = []
        for d in detections:
            bb = d["bounding_box"]
            box = (bb["x"], bb["y"], bb["x"] + bb["width"], bb["y"] + bb["height"])
            preds.append({"class_name": d["class_name"], "confidence": d["confidence"], "box": box, "matched": False})

        # Ghep tung GT voi du doan IoU cao nhat con trong (>= threshold), uu tien
        # theo confidence du doan giam dan de du doan chac chan duoc ghep truoc.
        preds_sorted = sorted(preds, key=lambda p: -p["confidence"])
        img_correct, img_wrong_class = 0, 0
        matches = []
        for p in preds_sorted:
            best_gt, best_iou = None, 0.0
            for gt in gts:
                if gt["matched"]:
                    continue
                score = iou(p["box"], gt["box"])
                if score > best_iou:
                    best_iou, best_gt = score, gt
            if best_gt is not None and best_iou >= IOU_THRESHOLD:
                best_gt["matched"] = True
                p["matched"] = True
                is_correct = p["class_name"] == best_gt["class_name"]
                if is_correct:
                    img_correct += 1
                else:
                    img_wrong_class += 1
                matches.append(
                    {
                        "gt": best_gt["class_name"],
                        "pred": p["class_name"],
                        "conf": p["confidence"],
                        "iou": round(best_iou, 3),
                        "correct": is_correct,
                    }
                )

        img_missed = sum(1 for gt in gts if not gt["matched"])
        img_fp = sum(1 for p in preds if not p["matched"])

        total_gt += len(gts)
        total_correct += img_correct
        total_wrong_class += img_wrong_class
        total_missed += img_missed
        total_extra_fp += img_fp

        per_image_report.append(
            {
                "image": img_path.name,
                "gt_count": len(gts),
                "pred_count": len(preds),
                "correct": img_correct,
                "wrong_class": img_wrong_class,
                "missed": img_missed,
                "extra_fp": img_fp,
                "matches": matches,
            }
        )

    print(json.dumps({"per_image": per_image_report}, indent=2, ensure_ascii=False))
    print("\n=== TONG KET ===", file=sys.stderr)
    print(f"Tong so GT box (vat that trong {len(images)} anh valid): {total_gt}", file=sys.stderr)
    print(f"Dung ca vi tri lan lop  (TP)      : {total_correct}", file=sys.stderr)
    print(f"Dung vi tri, SAI lop            : {total_wrong_class}", file=sys.stderr)
    print(f"Bo sot hoan toan (FN)            : {total_missed}", file=sys.stderr)
    print(f"Du doan thua khong khop GT (FP)  : {total_extra_fp}", file=sys.stderr)
    acc = total_correct / total_gt * 100 if total_gt else 0.0
    localized = (total_correct + total_wrong_class) / total_gt * 100 if total_gt else 0.0
    print(f"\n% dung lop / tong GT   : {acc:.1f}%", file=sys.stderr)
    print(f"% dinh vi dung (bat ke lop) / tong GT: {localized:.1f}%", file=sys.stderr)


if __name__ == "__main__":
    main()
