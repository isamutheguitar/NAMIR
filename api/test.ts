// api/test.ts
export default function handler(req: any, res: any) {
  res.status(200).json({ status: "success", message: "Vercel Serverless is alive!" });
}