const Benchmark = require('benchmark');

const suite = new Benchmark.Suite;

suite
  .add(`a`, function() {
  })
  .add(`b`, function() {
  })
  .on('cycle', function(event) {
    console.log(String(event.target) + `, ${Math.round(1000000000 / event.target.hz)} ns/op`);
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
