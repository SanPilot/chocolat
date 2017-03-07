// Script to interact with the interface and the WebWorker simulaton

// Define variable
var $ = (id) => {
  return document.getElementById(id);
};

// Prototype functions for removing DOM elements
Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
    if(this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i]);
    }
  }
};

// Begin the script when the page loads
window.onload = () => {

  // Display the help text
  $("results").innerHTML = '<span class="status">Press \'Simulate\' in the bottom left to begin the simulation.<span>';

  // Display the correct amount of player inputs
  $("players").onchange = () => {
    if($("players").value <= 0) $("players").value = 1;
    var newVal = $("players").value,
    numPlayers = document.getElementsByClassName("players").length,
    diff = Math.abs(newVal - numPlayers);

    if(newVal > numPlayers) {
      // Add the new player value inputs
      for(var i = 0; i < diff; i++) {
        var appendElement = document.createElement("span");
        appendElement.className = "players";
        appendElement.innerHTML = 'Player ' + (i + 1 + numPlayers) + ': <input class="settings-input" id="players-' + (i + 1 + numPlayers) + '" type="number" value="' + (+$("players-" + (i + numPlayers)).value + 1) +'">';
        $("players-container").appendChild(appendElement);
      }
    } else {
      // Remove the players no longer needed
      for(var i2 = 0; i2 < diff; i2++) {
        document.getElementsByClassName("players")[document.getElementsByClassName("players").length - 1].remove();
      }
    }
  };

  // Begin the simulation when the button is pressed
  var simulate = () => {

    // Pre-flight: ensure are values are valid
    var players = [], range = {
      min: +$("range-min").value,
      max: +$("range-max").value
    };

    // If the simulation may take a long time, warn the user
    if(range.max - range.min >= 20000) {
      if(!confirm("The simulation you have selected may take a long time to complete.\nRun the simulation anyways?")) return;
    }

    $("results").className = 'results';

    if(range.min >= range.max) {
      $("results").innerHTML = '<span class="status error">The provided range is invalid.</span>';
      return;
    }
    if(range.min % 1 !== 0 || range.max % 1 !== 0) {
      $("results").innerHTML = '<span class="status error">The range cannot include a decimal.</span>';
      return;
    }
    if(document.getElementsByClassName("players").length >= (range.max - range.min) + 1) {
      $("results").innerHTML = '<span class="status error">There cannot be more than ' + (range.max - range.min) + ' other players.</span>';
      return;
    }
    for(var i = 0; i < document.getElementsByClassName("players").length; i++) {
      var playerValue = +$("players-" + (i + 1)).value;
      if(players.indexOf(playerValue) !== -1) {
        $("results").innerHTML = '<span class="status error">Players ' + (players.indexOf(playerValue) + 1) + ' and ' + (i + 1) + ' cannot have the same guess.</span>';
        return;
      }
      if(playerValue < range.min || playerValue > range.max) {
        $("results").innerHTML = '<span class="status error">Player ' + (i + 1) + '\'s guess of ' + playerValue + ' is outside of the range of ' + range.min + ' to ' + range.max + '.</span>';
        return;
      }
      players.push(playerValue);
    }
    if(!window.Worker) {
      $("results").innerHTML = '<span class="status error">This simulation is not supported on your system!</span>';
      return;
    }

    // Everything checks out, start the simulation!
    $("results").innerHTML = '<div class="status">Starting simulation...';
    $("results").innerHTML += '<progress></progress></div>';

    // Create the simulation
    var simulation = new Worker('simulate.js');
    simulation.postMessage({players: players, range: range});

    // Allow the user to cancel
    $("launch").innerHTML = "Cancel";
    $("launch").onclick = () => {
      simulation.terminate();
      $("results").innerHTML = '<span class="status">Press \'Simulate\' in the bottom left to begin the simulation.<span>';
      $("launch").onclick = simulate;
      $("launch").innerHTML = "Simulate";
    };

    // Process messages from the simulation
    simulation.onmessage = ((e) => {
      if(!e.data.done) {
        if(e.data.percentage > 0) {
          if(e.data.percentage < 99) {
            $("results").innerHTML = '<div class="status">Simulating... (' + Math.round(e.data.percentage) + '% done)';
            $("results").innerHTML += '<progress value="' + e.data.percentage + '" max="100"></progress></div>';
          } else {
            $("results").innerHTML = '<div class="status">Sorting results.';
            $("results").innerHTML += '<progress></progress></div>';
          }
        }
      } else {
        $("launch").onclick = simulate;
        $("launch").innerHTML = "Simulate";

        // Display the results of the simulation
        $("results").className += " left";
        $("results").innerHTML = '<div class="results-header">Showing the top ' + e.data.results.length + ' results.</div>';
        $("results").innerHTML += '<div class="status">Simulation finished in <b>' + e.data.time / 1000 + ' seconds</b>.</div>';
        var resultsContainer = document.createElement("div");
        for(var i = 0; i < e.data.results.length; i++) {
          var appendElement = document.createElement("div");
          appendElement.className = "result";
          appendElement.innerHTML = 'A guess of <b>' + e.data.results[i][0] + '</b> has a ' + ((e.data.results[i][1] / (range.max - range.min)) * 100).toFixed(1) + ' percent chance of winning.';
          resultsContainer.appendChild(appendElement);
        }
        $("results").appendChild(resultsContainer);
      }
    });
  };

  // Begin the simulation when the button is pressed
  $("launch").onclick = simulate;
};
