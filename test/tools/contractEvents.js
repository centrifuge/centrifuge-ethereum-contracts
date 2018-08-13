module.exports = {
  assertEvent: function (result, event, keys) {
    for (let log in result.logs) {
      let item = result.logs[log];
      if (item.event === event) {
        for (let key in keys) {
          let value = item.args[key];
          if(value && value instanceof web3.BigNumber) {
            value = web3.toHex(value);

          }
          assert.equal(value, keys[key], "Keys should match");
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
