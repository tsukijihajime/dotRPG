import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const getGitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'local';
  }
};

const getBuildTime = () => {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const Y = jst.getUTCFullYear();
  const M = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const D = String(jst.getUTCDate()).padStart(2, '0');
  const h = String(jst.getUTCHours()).padStart(2, '0');
  const m = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${Y}.${M}.${D} ${h}:${m}`;
};

// GitHub Pages では https://<ユーザー名>.github.io/dotRPG/ で公開されるため base を合わせる
export default defineConfig({
  base: '/dotRPG/',
  define: {
    __APP_VERSION__: JSON.stringify('1.2.0'),
    __BUILD_INFO__: JSON.stringify(`v1.2.0 (${getBuildTime()} #${getGitCommit()})`),
  },
});
