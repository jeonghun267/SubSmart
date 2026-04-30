/**
 * 앱인토스 .ait 빌드 스크립트
 *
 * 정적 빌드 시 서버 전용 라우트(API, auth callback)를 임시로
 * src/app 밖으로 이동시키고, 빌드 후 복원합니다.
 */
import { execSync } from "child_process";
import { renameSync, existsSync, mkdirSync } from "fs";

const backupDir = ".server_backup";
const serverRoutes = [
  { src: "src/app/api", dest: `${backupDir}/api` },
  { src: "src/app/auth", dest: `${backupDir}/auth` },
];

// 백업 디렉토리 생성
mkdirSync(backupDir, { recursive: true });

const moved = [];

for (const { src, dest } of serverRoutes) {
  if (existsSync(src)) {
    renameSync(src, dest);
    moved.push({ src, dest });
    console.log(`[ait-build] excluded: ${src} → ${dest}`);
  }
}

try {
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "ait" },
  });

  // AIT CLI expects output in {outdir}/web/
  execSync("mv out .tmp_ait_out && mkdir -p out && mv .tmp_ait_out out/web");

  console.log("[ait-build] build complete! Output in ./out/web");
} finally {
  for (const { src, dest } of moved) {
    if (existsSync(dest)) {
      renameSync(dest, src);
      console.log(`[ait-build] restored: ${src}`);
    }
  }
  // 빈 백업 디렉토리 제거
  try { execSync(`rm -rf ${backupDir}`); } catch {}
}
