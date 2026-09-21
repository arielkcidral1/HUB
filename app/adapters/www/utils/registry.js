// Ponto de encontro entre o nucleo (script.js) e os modulos. Deve carregar antes dos modulos e do script.js.
// Cada modulo chama HubModules.register({ collection, table, view, mapRow, toPayload, render, ... }).
window.HubModules = {
  list: [],
  register(mod) {
    this.list.push(mod);
  },
  byCollection(collection) {
    return this.list.find((mod) => mod.collection === collection);
  },
  runAction(action, id, target) {
    for (const mod of this.list) {
      const handler = mod.actions && mod.actions[action];
      if (handler) {
        handler(id, target);
        return true;
      }
    }
    return false;
  },
};
