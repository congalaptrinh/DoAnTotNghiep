"""Cham diem model CU vs MOI tren CA MOT TAP (mac dinh test/) cua ElectroCom61 (co nhan that).
Usage: python eval_split.py <thu_muc_split_co_images_va_labels> [so_anh_toi_da]
Ghi ket qua tong hop ra eval_split_result.json."""
import json
import sys
from collections import Counter
from pathlib import Path

import cv2
from PIL import Image

import compare_models as cm

split = Path(sys.argv[1])
limit = int(sys.argv[2]) if len(sys.argv) > 2 else None
images = sorted((split / "images").glob("*.jpg"))[:limit]
BASE = Path(__file__).resolve().parent
models = {
    "old": cm.load_model(str(BASE / "models" / "best_v1_2071img.pt")),
    "new": cm.load_model(str(BASE / "models" / "best.pt")),
}
tot = {k: Counter() for k in models}
confusions = {k: Counter() for k in models}
per_class = {k: {} for k in models}
for i, p in enumerate(images, 1):
    lab = split / "labels" / (p.stem + ".txt")
    frame = cv2.imread(str(p))
    with Image.open(p) as im:
        w, h = im.size
    for k, m in models.items():
        s = cm.score_against_gt(cm.run_detect(m, frame), lab, w, h)
        for f in ("gt_count", "correct", "wrong_class", "missed", "extra_fp"):
            tot[k][f] += s[f]
        for mm in s["mismatches"]:
            confusions[k][f"{mm['gt']} -> {mm['pred']}"] += 1
    if i % 20 == 0:
        print(f"{i}/{len(images)}", {k: dict(v) for k, v in tot.items()}, flush=True)
result = {"images": len(images), "totals": {k: dict(v) for k, v in tot.items()},
          "top_confusions": {k: confusions[k].most_common(10) for k in models}}
Path("eval_split_result.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
for k in models:
    t = tot[k]
    print(f"{k}: {t['correct']}/{t['gt_count']} dung = {t['correct']/t['gt_count']*100:.1f}%  sai-lop={t['wrong_class']} bo-sot={t['missed']} du-thua={t['extra_fp']}")
    print("  top nham:", confusions[k].most_common(5))
