-- 工具图片上传（upload-tool-image）使用的 Storage bucket。
-- 若线上报错 "Bucket not found"，执行本 migration 或在 Dashboard → SQL 中运行下方 INSERT。

-- 列因 Supabase 版本略有差异；仅 id/name/public 各环境均支持
INSERT INTO storage.buckets (id, name, public)
VALUES ('material-images', 'material-images', true)
ON CONFLICT (id) DO NOTHING;
