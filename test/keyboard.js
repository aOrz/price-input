'use strict';
var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

['index.js', 'demo/index.js'].forEach(function (file) {
  var context = { document: {}, module: { exports: {} }, console: console };
  vm.runInNewContext('"use strict";\n' + fs.readFileSync(file, 'utf8'), context);
  var listeners = {};
  var el = {
    value: '¥1',
    selectionStart: 2,
    addEventListener: function (type, listener) { listeners[type] = listener; }
  };
  context.priceInput(el, '¥', 2);
  function key(code) {
    var prevented = false;
    listeners.keydown({keyCode: code, preventDefault: function () { prevented = true; }});
    return prevented;
  }
  assert.strictEqual(key(48), false, file + ': zero must be typeable');
  assert.strictEqual(key(49), false, file + ': one must be typeable in strict mode');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(context, 'CaretPos'), false);
  el.selectionStart = 0;
  assert.strictEqual(key(48), true, file + ': zero must not precede prefix');
  assert.strictEqual(key(49), true, file + ': one must not precede prefix');
  assert.strictEqual(key(190), true, file + ': decimal point must not precede prefix');
  el.selectionStart = 1;
  assert.strictEqual(key(8), true, file + ': preserve prefix on backspace');
  assert.strictEqual(context.getCursortPosition({}), 0, file + ': caret fallback');
  context.priceInput(el, 'USD ', 2);
  el.value = 'USD 1';
  el.selectionStart = 1;
  assert.strictEqual(key(48), true, file + ': digit must not split multi-character prefix');
  el.selectionStart = 5;
  assert.strictEqual(key(48), false, file + ': digit remains valid after full prefix');
  context.document.selection = { createRange: function () {
    return { moveStart: function () {}, text: '¥1' };
  }};
  assert.strictEqual(context.getCursortPosition({focus: function () {}, value: '¥1'}), 2,
    file + ': legacy caret lookup');
});
console.log('Keyboard regression tests passed for module and browser demo.');
