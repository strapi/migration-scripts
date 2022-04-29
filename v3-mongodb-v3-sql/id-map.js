class CollectionIdMap extends Map {
  constructor() {
    super();
    this._idx = 1;
  }

  nextId() {
    return this._idx++;
  }

  next(mongoId) {
    const id = this.nextId();
    this.set(mongoId.toString(), id);
    return id;
  }
}

const idMap = {
  _globalMap: new Map(),
  _collectionMap: {},
  collection(name) {
    if (!this._collectionMap[name]) {
      this._collectionMap[name] = new CollectionIdMap();
    }

    return this._collectionMap[name];
  },

  next(mongoId, collectionName) {
    // get collectionId
    const id = this.collection(collectionName).next(mongoId);
    // set global Id map for relation matching
    this._globalMap.set(mongoId.toString(), id);

    return id;
  },

  get(mongoId) {
    return this._globalMap.get(mongoId.toString());
  },
};

module.exports = idMap;
