import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, filename, contentType, uploadId, key, partNumber, parts } = req.body;

  if (action === 'start') {
    const k = `uploads/${Date.now()}-${filename}`;
    const cmd = new CreateMultipartUploadCommand({ Bucket: "repod", Key: k, ContentType: contentType });
    const { UploadId } = await s3.send(cmd);
    return res.status(200).json({ uploadId: UploadId, key: k });
  }

  if (action === 'part') {
    const cmd = new UploadPartCommand({ Bucket: "repod", Key: key, UploadId: uploadId, PartNumber: partNumber });
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    return res.status(200).json({ signedUrl });
  }

  if (action === 'complete') {
    const cmd = new CompleteMultipartUploadCommand({
      Bucket: "repod", Key: key, UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await s3.send(cmd);
    const publicUrl = `https://pub-7fc49bc38ef843c4b661126192316ebc.r2.dev/${key}`;
    return res.status(200).json({ url: publicUrl });
  }

  return res.status(400).json({ error: "Invalid action" });
}
