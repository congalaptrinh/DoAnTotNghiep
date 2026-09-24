FROM python:3.11-slim

# libgl1/libglib2.0-0: opencv-python (cv2) can de import duoc tren Linux khong co man hinh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# torch/torchvision rieng truoc bang index CPU-only cua PyTorch: pip mac dinh
# tren Linux se keo ban co CUDA/GPU day du (~10GB, may nay khong co GPU nao
# dung toi) — cai truoc bang index nay de "khoa" ban CPU nhe, requirements.txt
# sau do thay da co san nen bo qua, chi cai not cac goi con lai tu PyPI thuong.
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY yolov9_src ./yolov9_src
COPY models ./models

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
