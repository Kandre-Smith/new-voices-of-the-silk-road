import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`丝路新声 后端已启动: http://localhost:${config.port}`);
  console.log(`健康检查: http://localhost:${config.port}/api/health`);
  console.log(`局域网访问: http://<本机IP>:${config.port} （手机与电脑需同一网络）`);
});
