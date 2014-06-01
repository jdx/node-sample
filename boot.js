// This script will boot app.js with the number of workers
// specified in WORKER_COUNT.
//
// The master will respond to SIGHUP, which will trigger
// restarting all the workers and reloading the app.

var cluster = require('cluster');
var workerCount = process.env.WORKER_COUNT || 2;

// Defines what each worker needs to run
// In this case, it's app.js a simple node http app
cluster.setupMaster({ exec: 'app.js' });

// Gets the count of active workers
function numWorkers() { return Object.keys(cluster.workers).length; }

var stopping = false;

// Forks off the workers unless the server is stopping
function forkNewWorkers() {
  if (!stopping) {
    for (var i = numWorkers(); i < workerCount; i++) { cluster.fork(); }
  }
}

// A list of workers queued for a restart
var workersToStop = [];

// Stops a single worker
// Gives 60 seconds after disconnect before SIGTERM
function stopWorker(worker) {
  console.log('stopping', worker.process.pid);
  worker.disconnect();
  var killTimer = setTimeout(function() {
    worker.kill();
  }, 5000);

  // Ensure we don't stay up just for this setTimeout
  killTimer.unref();
}

// Tell the next worker queued to restart to disconnect
// This will allow the process to finish it's work
// for 60 seconds before sending SIGTERM
function stopNextWorker() {
  var i = workersToStop.pop();
  var worker = cluster.workers[i];
  if (worker) stopWorker(worker);
}

// Stops all the works at once
function stopAllWorkers() {
  stopping = true;
  console.log('stopping all workers');
  for (var id in cluster.workers) {
    stopWorker(cluster.workers[id]);
  }
}

// Worker is now listening on a port
// Once it is ready, we can signal the next worker to restart
cluster.on('listening', stopNextWorker);

// A worker has disconnected either because the process was killed
// or we are processing the workersToStop array restarting each process
// In either case, we will fork any workers needed
cluster.on('disconnect', forkNewWorkers);

// HUP signal sent to the master process to start restarting all the workers sequentially
process.on('SIGHUP', function() {
  console.log('restarting all workers');
  workersToStop = Object.keys(cluster.workers);
  stopNextWorker();
});

// Kill all the workers at once
process.on('SIGTERM', stopAllWorkers);

// Fork off the initial workers
forkNewWorkers();
console.log('app master', process.pid, 'booted');
