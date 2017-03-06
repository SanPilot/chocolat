// This service worker script is responsible for simulating and returning the results

onmessage = (e) => {
  var timer = Date.now(),
  range = e.data.range,
  players = e.data.players,
  last = 0,
  calcs = Math.pow((range.max - range.min), 2),
  reportAt = Math.round(calcs / 100),
  results = [],
  calc = 0;
  postMessage({percentage: 0});

  // Begin the simulation
  for(var actual = range.min; actual <= range.max; actual++) {
    for(var guess = range.min; guess <= range.max; guess++) {
      var won = true,
      diff = Math.abs(actual - guess);
      for(var i = 0; i < players.length; i++) {
        if(Math.abs(actual - players[i]) < diff) {
          won = false;
          break;
        }
      }
      if(won && players.indexOf(guess) === -1) {
        if(results[guess - range.min]) {
          results[guess - range.min][1]++;
        } else {
          results[guess - range.min] = [guess, 1];
        }
      }
      if(++calc % reportAt === 0) {
        // Update the frontend's status
        postMessage({percentage: (calc / calcs) * 100});
      }
    }
  }

  // Sort and send the result
  postMessage({
    done: true,
    results: results.filter((value) => {
      return value !== undefined;
    }).sort((a, b) => {
      return b[1] - a[1];
    }).slice(0, 50),
    time: Date.now() - timer
  });

  // End the simulation
  close();
};
