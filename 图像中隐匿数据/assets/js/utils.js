let CLUtils = {};
((window, document) => {
  /**
   *
   * @param {string} content
   */
  async function setClipboard(content) {
    if (navigator && "clipboard" in navigator) {
      const type = "text/plain";
      const blob = new Blob([content], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
    } else {
      const textareaEle = document.createElement("textarea");
      textareaEle.value = content || "";
      textareaEle.style.position = "absolute";
      textareaEle.style.opacity = "0";
      document.body.appendChild(textareaEle);
      textareaEle.select();
      document.execCommand("copy");
      textareaEle.remove();
    }
  }

  /**
   *
   * @param {HTMLTextAreaElement} target
   */
  async function copy(target) {
    let start = target.selectionStart;
    let end = target.selectionEnd;
    if (start === end) {
      target.select();
    }
    let selectText = window.getSelection().toString();
    target.selectionStart = start;
    target.selectionEnd = end;
    if (start !== end) {
      target.focus();
    }
    await setClipboard(selectText);
  }

  CLUtils = {
    setClipboard,
    copy
  }
})(window, document);
