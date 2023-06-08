const backgroundToContentPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "background";
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    );
  },
  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "content") {
        return;
      }
      callback(result);
    });
  },
};

const contentToBackgroundPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "content";
    chrome.runtime.sendMessage(message);
  },

  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "background") {
        return;
      }
      callback(result);
    });
  },
};

const contentToPopupPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "content";
    chrome.runtime.sendMessage(message);
  },

  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "popup") {
        return;
      }
      callback(result);
    });
  },
};

const popupToContentPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "popup";
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    );
  },

  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "content") {
        return;
      }
      callback(result);
    });
  },
};

const backgroundToPopupPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "background";
    chrome.runtime.sendMessage(message);
  },
  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "popup") {
        return;
      }
      callback(result);
    });
  },
};

const popupToBackgroundPort = {
  /**
   * @param {{type: string, data: Record<string, any>, from: string}} message
   */
  sendMessage(message) {
    message.from = "popup";
    chrome.runtime.sendMessage(message);
  },
  /**
   * @param {(result: {type: string, data: Record<string, any>, from: string}) => void} callback
   */
  onMessage(callback) {
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.from !== "background") {
        return;
      }
      callback(result);
    });
  },
};