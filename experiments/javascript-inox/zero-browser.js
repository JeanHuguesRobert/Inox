// Experimental ZeroBrowser projection profile; Cogentia #291 / Inox #41.
// Host primitives operate on observed field metadata, not on live DOM objects.
export function installZeroBrowser(vm, fields) {
  const push = (v, value) => v.push({name:'', type:'literal', value});
  const binary = (name, f) => vm.primitive(name, v => {
    const b = v.pop().value, a = v.pop().value;
    push(v, f(a,b));
  });
  binary('get', (a,b) => a?.[b]);
  binary('eq', (a,b) => a === b);
  binary('and', (a,b) => a && b);
  binary('lt', (a,b) => a < b);
  vm.primitive('not', v => push(v, !v.pop().value));
  vm.primitive('secret?', v => push(v, /username|password|one-time-code|cc-number|cc-csc/i.test(String(v.pop().value || ''))));
  vm.primitive('count', v => push(v, fields.length));
  vm.primitive('field', v => push(v, fields[v.pop().value]));
  return vm;
}
