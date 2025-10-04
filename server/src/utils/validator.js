function requireFields(obj = {}, fields = []) {
  for (const f of fields) {
    if (!obj || obj[f] === undefined || obj[f] === null || obj[f] === "")
      return false;
  }
  return true;
}

module.exports = { requireFields };
