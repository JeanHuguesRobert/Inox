// Experimental ZeroBrowser projection profile; Cogentia #291 / Inox #41.
// Host primitives operate on observed field metadata, not on live DOM objects.
export function installZeroBrowser(vm, fields) {
  const push = (v, value) => v.push({name:'', type:'literal', value});
  // Legacy imports retained for the original v0 image.
  const alias = (name, target) => vm.primitive(name, vm.cells[vm.words.get(target)].value);
  alias('eq','equal?');
  alias('lt','<');
  vm.primitive('secret?', v => push(v, /username|password|one-time-code|cc-number|cc-csc/i.test(String(v.pop().value || ''))));
  vm.primitive('count', v => push(v, fields.length));
  vm.primitive('field', v => push(v, fields[v.pop().value]));
  return vm;
}
