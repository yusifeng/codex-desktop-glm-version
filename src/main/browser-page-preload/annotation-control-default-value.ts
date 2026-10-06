function getAnnotationControlDefaultValue(control: any): any {
  const value = control.defaultValue ?? control.currentValue;
  if (value != null) return value;
  switch (control.type) { case `color`: return `#ffffff`; case `select`: return control.options[0].value; case `range`: return control.min; case `toggle`: return false; }
  return undefined;
}
export { getAnnotationControlDefaultValue };
if (typeof module !== `undefined`) module.exports = { getAnnotationControlDefaultValue };
