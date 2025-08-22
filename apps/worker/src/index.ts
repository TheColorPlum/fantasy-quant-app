const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function workerLoop() {
  console.log("Worker started");
  
  while (true) {
    console.log("no jobs yet");
    await sleep(5000);
  }
}

workerLoop().catch(error => {
  console.error("Worker crashed:", error);
  process.exit(1);
});