// Simple mapped emergency guidance generator keyed by highest TCWS number
module.exports = {
  recommendActions(signals, t) {
    // t is the translations object for specific language
    const highest = signals && signals.length ? Math.max(...signals.map(s => parseInt(s.number) || 0)) : 0;
    const set = new Set();

    if (highest >= 4) {
      if (t.actions?.Evacuate) set.add(t.actions.Evacuate);
      if (t.actions?.FindShelter) set.add(t.actions.FindShelter);
      if (t.actions?.Prepare) set.add(t.actions.Prepare);
      if (t.actions?.Monitor) set.add(t.actions.Monitor);
    } else if (highest === 3) {
      if (t.actions?.Evacuate) set.add(t.actions.Evacuate);
      if (t.actions?.Prepare) set.add(t.actions.Prepare);
      if (t.actions?.Monitor) set.add(t.actions.Monitor);
    } else if (highest === 2) {
      if (t.actions?.StayIndoors) set.add(t.actions.StayIndoors);
      if (t.actions?.Prepare) set.add(t.actions.Prepare);
      if (t.actions?.Monitor) set.add(t.actions.Monitor);
    } else if (highest === 1) {
      if (t.actions?.Monitor) set.add(t.actions.Monitor);
      if (t.actions?.Prepare) set.add(t.actions.Prepare);
    } else {
      if (t.actions?.Monitor) set.add(t.actions.Monitor);
    }

    return Array.from(set);
  }
};
