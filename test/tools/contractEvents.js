module.exports = {
    assertEvent: function (result, event, keys , keyTransformers) {
        for (let log in result.logs) {
            let item = result.logs[log];
            if (item.event === event) {
                for (let key in keys) {
                    let value = item.args[key];
                    if(keyTransformers && keyTransformers[key]) {
                        assert.equal(keyTransformers[key](value), keys[key], "Keys should match");
                    } else {
                        assert.equal(value, keys[key], "Keys should match");
                    }

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
    },
    getEvents: function (tx, event) {
        let list = []
        for (let log in tx.logs) {
            let item = tx.logs[log];
            if (item.event === event) {
                list.push(item.args);

            }
        }
        return list;
    }
};
