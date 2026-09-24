"""So sanh model CU vs MOI tren anh chup that bang camera dien thoai (Giai doan G2).
Usage: python compare_phone.py <anh1> [anh2 ...]  — in detections + luu anh chu thich old_/new_."""
import sys
from pathlib import Path

import cv2

from compare_models import load_model, run_detect

BASE = Path(__file__).resolve().parent
models = {
    "CU (2071 anh)": load_model(str(BASE / "models" / "best_v1_2071img.pt")),
    "MOI (~13k anh)": load_model(str(BASE / "models" / "best.pt")),
}
for img_path in map(Path, sys.argv[1:]):
    frame = cv2.imread(str(img_path))
    print(f"\n===== {img_path.name} ({frame.shape[1]}x{frame.shape[0]}) =====")
    for name, model in models.items():
        dets = sorted(run_detect(model, frame), key=lambda d: -d["confidence"])
        print(f"--- {name}: {len(dets)} detection ---")
        out = frame.copy()
        for d in dets:
            x1, y1, x2, y2 = map(int, d["box"])
            print(f"  {d['class_name']:32s} {d['confidence']:.2f}  box=({x1},{y1},{x2},{y2})")
            cv2.rectangle(out, (x1, y1), (x2, y2), (0, 0, 255), 6)
            cv2.putText(out, f"{d['class_name']} {d['confidence']:.2f}", (x1, max(40, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 5)
        tag = "old" if name.startswith("CU") else "new"
        cv2.imwrite(str(img_path.with_name(f"{tag}_{img_path.stem}.jpg")), cv2.resize(out, None, fx=0.4, fy=0.4))
