// Use in case when need to remove property names where have dots
// Example: { "avatar.id": 1, "avatar.type": "image/jpeg" }
const normalizePropertyNames = (object) => {
  const modifiedObj = {};
  const names = [];

  Object.keys(object).map((key) => {
    if (~key.indexOf('.')) {
      names.push(key);
    } else {
      modifiedObj[key] = object[key];
    }
  });

  names.map((name) => {
    const newProperty = {};
    const parts = name.split('.');
    newProperty[parts[1]] = object[name];
    modifiedObj[parts[0]] = { ...modifiedObj[parts[0]], ...newProperty };
  });

  return modifiedObj;
};

module.exports = normalizePropertyNames;
