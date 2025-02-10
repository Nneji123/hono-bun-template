export function getServerInfo() {
  const bunVersion = Bun.version;
  const nodeEnv = Bun.env.NODE_ENV || 'development';
  const os = require('os');

  console.log(`Bun Version: ${bunVersion}`);
  console.log(`Node Environment: ${nodeEnv}`);
  console.log(`OS Platform: ${os.platform()}`);
  console.log(`OS Release: ${os.release()}`);
  console.log(`CPU Cores: ${os.cpus().length}`);
  console.log(
    `Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`
  );
  console.log(
    `Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`
  );
}
