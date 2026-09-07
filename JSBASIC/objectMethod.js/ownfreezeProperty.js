function customFreeze(obj) {
    // Get all keys of the object
    let keys = Object.keys(obj);

    // Iterate over all keys to make each property non-configurable
    for (let i = 0; i < keys.length; i++) {
        Object.defineProperty(obj, keys[i], { configurable: false ,writable:false}); // Prevent deletion or redefinition
    }

    // this will stop addition of news  keys value to the pairs
    Object.preventExtensions(obj); // this will stop addition of new keys value pairs
}
