// Experimental ZeroBrowser projection profile; Cogentia #291 / Inox #41.
// Host primitives operate on observed field metadata, not on live DOM objects.
export function installZeroBrowser(vm, fields) {
  const push = (v, value) => v.push({name:'', type:'literal', value});
  vm.primitive('count', v => push(v, fields.length));
  // The native Inox object is a metadata projection, not a DOM handle.
  // Do not expose unreviewed properties or input values.
  vm.primitive('field.object', v => {
    const index=v.pop().value, source=fields[index];
    if(source===null||typeof source!=='object'){
      v.push({name:'',type:'void',value:null});return;
    }
    const members=[];
    for(const name of ['tag','type','disabled','readonly','autocomplete']){
      if(!Object.hasOwn(source,name))continue;
      const value=source[name];
      if(value===undefined||value===null)continue;
      if(typeof value!=='string'&&typeof value!=='boolean'&&typeof value!=='number')
        throw Error('invalid field metadata');
      members.push({name,type:'literal',value});
    }
    v.push({name:'field',type:'object',value:{klass:'browser-field',fields:members,extensible:false}});
  });
  return vm;
}
