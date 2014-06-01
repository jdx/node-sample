var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

// Defines what each worker needs to run
// In this case, it's app.js a simple node http app
cluster.setupMaster({
  exec: 'app.js'
});

// Fork off a new worker for each of my CPUs
for (var i = 0; i < numCPUs; i++) { cluster.fork(); }

// A list of workers queued for a restart
var workersToKill = [];

// Tell the next worker queued to restart to disconnect
// This will allow the process to finish it's work
// for 60 seconds before sending SIGTERM
function killNextWorker() {
  var i = workersToKill.pop();
  var worker = cluster.workers[i];
  if (worker) {
    worker.disconnect();
    setTimeout(function() {
      worker.kill();
    }, 60000);
  }
}

// Worker is now listening on a port
// Once it is ready, we can signal the next worker to restart
cluster.on('listening', function(worker) {
  console.log('worker', worker.process.pid, 'listening');
  killNextWorker();
});

// A worker has disconnected either because the process was killed
// or we are processing the workersToKill array restarting each process
// In either case, we will simply boot a new process
cluster.on('disconnect', function(worker) {
  console.log('worker', worker.process.pid, 'disconnected');
  cluster.fork();
});

// HUP signal sent to the master process to start restarting all the workers sequentially
process.on('SIGHUP', function() {
  console.log('SIGHUP received, reloading workers');
  workersToKill = Object.keys(cluster.workers); // Populate the array with all the workers we will need to restart
  killNextWorker();
});

console.log('app master', process.pid, 'booted');
