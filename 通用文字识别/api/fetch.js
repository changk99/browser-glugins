const requests = {}
/**
 * @param {string} input
 * @param {object} options
 * @param {number} timeout
 * @retrun {Promise<Record<string, any>>}
 */
function fetchWithTimeout(input, options, timeout = 3000) {
  // content.js 有跨域限制,传到 background.js 发起连接
  const requestID = Date.now();
  chrome.runtime.sendMessage({
    type: "fetch",
    requestID: requestID,
    data: {
      input,
      options,
      timeout,
    },
  })

  return new Promise((resolve, reject) => {
    requests[requestID] = {
      resolve,
      reject
    }
  })
}

chrome.runtime.onMessage.addListener(async ({ type, data, requestID }) => {
  if (type === "fetch") {
    const { resolve, reject} = requests[requestID]
    if (data.errCode) {
      reject(new Error(data.errMessage))
    } else {
      resolve(data.result)
    }
    delete requests[requestID]
  }
})
