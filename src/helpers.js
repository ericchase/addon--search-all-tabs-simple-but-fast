/**
 * @template {Document|HTMLElement|Window} T
 * @param {T} el
 * @param {(evt:KeyboardEvent)=>void} callback
 */
export function SetupKeyClickHandlers(el, callback) {
  /** @param {KeyboardEvent} evt */
  function keydown(evt) {
    if (evt.repeat !== true) {
      if (el instanceof Document) el.addEventListener('keyup', keyup);
      if (el instanceof HTMLElement) el.addEventListener('keyup', keyup);
      if (el instanceof Window) el.addEventListener('keyup', keyup);
    }
  }
  /** @param {KeyboardEvent} evt */
  function keyup(evt) {
    if (el instanceof Document) el.removeEventListener('keyup', keyup);
    if (el instanceof HTMLElement) el.removeEventListener('keyup', keyup);
    if (el instanceof Window) el.removeEventListener('keyup', keyup);
    callback(evt);
  }
  if (el instanceof Document) el.addEventListener('keydown', keydown);
  if (el instanceof HTMLElement) el.addEventListener('keydown', keydown);
  if (el instanceof Window) el.addEventListener('keydown', keydown);
  el.addEventListener('blur', (evt) => {
    if (el instanceof Document) el.removeEventListener('keyup', keyup);
    if (el instanceof HTMLElement) el.removeEventListener('keyup', keyup);
    if (el instanceof Window) el.removeEventListener('keyup', keyup);
  });
}
