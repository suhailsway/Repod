import boto3, uuid, re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

R2_ENDPOINT = "https://edd674a7e783406f363d0e75a44d6390.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "8eb5fcad22ccbaa166371dc2acb9f815"
R2_SECRET_KEY = "aa5e0db8803ede5a9b2ec47ad350f1eb1819367d588761e2383ac97de40f96a3"
R2_BUCKET = "repod"
PUBLIC_URL = "https://pub-7fc49bc38ef843c4b661126192316ebc.r2.dev"

s3 = boto3.client("s3", endpoint_url=R2_ENDPOINT, aws_access_key_id=R2_ACCESS_KEY, aws_secret_access_key=R2_SECRET_KEY, region_name="auto")

uploads = {}

@app.route("/upload/start", methods=["POST"])
def start():
    data = request.json
    filename = re.sub(r"[^a-zA-Z0-9._-]", "_", data.get("filename", "video.mp4"))
    upload_id_local = str(uuid.uuid4())
    key = f"uploads/{upload_id_local}-{filename}"
    mpu = s3.create_multipart_upload(Bucket=R2_BUCKET, Key=key)
    uploads[upload_id_local] = {"key": key, "upload_id": mpu["UploadId"], "parts": []}
    return jsonify({"upload_id": upload_id_local})

@app.route("/upload/chunk", methods=["POST"])
def chunk():
    upload_id_local = request.form.get("upload_id")
    part_number = int(request.form.get("part_number"))
    data = uploads.get(upload_id_local)
    if not data:
        return jsonify({"error": "Unknown upload_id"}), 400
    chunk_data = request.files["chunk"].read()
    part = s3.upload_part(Bucket=R2_BUCKET, Key=data["key"], PartNumber=part_number, UploadId=data["upload_id"], Body=chunk_data)
    data["parts"].append({"PartNumber": part_number, "ETag": part["ETag"]})
    return jsonify({"ok": True})

@app.route("/upload/complete", methods=["POST"])
def complete():
    upload_id_local = request.json.get("upload_id")
    data = uploads.get(upload_id_local)
    if not data:
        return jsonify({"error": "Unknown upload_id"}), 400
    parts = sorted(data["parts"], key=lambda x: x["PartNumber"])
    s3.complete_multipart_upload(Bucket=R2_BUCKET, Key=data["key"], UploadId=data["upload_id"], MultipartUpload={"Parts": parts})
    del uploads[upload_id_local]
    return jsonify({"url": f"{PUBLIC_URL}/{data['key']}"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
