module.exports = {
  assertEvent: function (result, event, keys) {
    for (let log in result.logs) {
      let item = result.logs[log];
      if (item.event === event) {
        for (let key in keys) {
          assert.equal(item.args[key], keys[key], "Keys should match");
        }
        break;
      }
    }
  },
  getEventValue: function (result, event, key) {
    let foundValue;
    for (let log in result.logs) {
      let item = result.logs[log];
      if (item.event === event) {
        foundValue = item.args[key];
        break;
      }
    }
    return foundValue;
  }
};
